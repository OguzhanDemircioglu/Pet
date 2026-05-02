package com.petshop.saas.service;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.saas.dto.BulkImportResult;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * CSV format (UTF-8, başlık satırı zorunlu, virgül veya noktalı virgül ayraç):
 *
 *   name,sku,price,stock
 *   "Royal Canin Mama 5kg",RC-5KG,189.90,42
 *   "Whiskas Kedi Maması",WHS-2KG,79.50,150
 *
 * Limitler:
 *   - max 1000 satır
 *   - SKU çakışması → satır skip + error eklenir
 *   - Plan limit aşılırsa → kalan satırlar skip + error
 *   - Hatalı satırlar atomik değil; başarılılar commit olur (per-row try)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SaasImportService {

    private static final int MAX_ROWS = 1000;

    private final ProductRepository productRepository;
    private final PlanLimitService planLimitService;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @Transactional
    public BulkImportResult importProductsCsv(MultipartFile file) {
        Long cid = TenantContext.require();
        if (file == null || file.isEmpty()) {
            return new BulkImportResult(0, 0, 0, List.of(new BulkImportResult.RowError(0, "Dosya boş")));
        }

        List<BulkImportResult.RowError> errors = new ArrayList<>();
        int created = 0;
        int total = 0;
        int skipped = 0;
        Set<String> seenSkus = new HashSet<>();

        try (BufferedReader r = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = r.readLine();
            if (header == null) {
                return new BulkImportResult(0, 0, 0, List.of(new BulkImportResult.RowError(0, "Başlık satırı eksik")));
            }
            String[] cols = parseRow(header);
            int nameIdx  = indexOf(cols, "name");
            int skuIdx   = indexOf(cols, "sku");
            int priceIdx = indexOf(cols, "price");
            int stockIdx = indexOf(cols, "stock");
            if (nameIdx < 0 || skuIdx < 0 || priceIdx < 0 || stockIdx < 0) {
                return new BulkImportResult(0, 0, 0, List.of(new BulkImportResult.RowError(0,
                        "Başlık 'name,sku,price,stock' içermeli (mevcut: " + String.join(",", cols) + ")")));
            }

            String line;
            int rowNo = 1; // 0 = header
            while ((line = r.readLine()) != null) {
                rowNo++;
                if (line.trim().isEmpty()) continue;
                total++;
                if (total > MAX_ROWS) {
                    errors.add(new BulkImportResult.RowError(rowNo, "Limit aşıldı (max " + MAX_ROWS + " satır)"));
                    break;
                }
                try {
                    String[] vals = parseRow(line);
                    String name = safe(vals, nameIdx);
                    String sku  = safe(vals, skuIdx);
                    String priceStr = safe(vals, priceIdx);
                    String stockStr = safe(vals, stockIdx);

                    if (name.isBlank() || sku.isBlank()) {
                        errors.add(new BulkImportResult.RowError(rowNo, "name ve sku zorunlu"));
                        skipped++;
                        continue;
                    }
                    if (!seenSkus.add(sku)) {
                        errors.add(new BulkImportResult.RowError(rowNo, "Aynı dosyada tekrar eden SKU: " + sku));
                        skipped++;
                        continue;
                    }
                    if (productRepository.findBySku(sku).isPresent()) {
                        errors.add(new BulkImportResult.RowError(rowNo, "SKU zaten kayıtlı: " + sku));
                        skipped++;
                        continue;
                    }

                    BigDecimal price = new BigDecimal(priceStr.replace(',', '.'));
                    int stock = Integer.parseInt(stockStr.trim());
                    if (price.signum() < 0 || stock < 0) {
                        errors.add(new BulkImportResult.RowError(rowNo, "price/stock negatif olamaz"));
                        skipped++;
                        continue;
                    }

                    // Plan limit kontrolü her satır için
                    try {
                        planLimitService.assertCanAddProduct(cid);
                    } catch (com.petshop.tenant.exception.PlanLimitExceededException ex) {
                        errors.add(new BulkImportResult.RowError(rowNo, "Plan limiti aşıldı, kalan satırlar atlandı"));
                        skipped++;
                        break;
                    }

                    Product p = Product.builder()
                            .companyId(cid)
                            .name(name)
                            .slug(slugify(name) + "-" + System.currentTimeMillis() + "-" + rowNo)
                            .sku(sku)
                            .basePrice(price)
                            .stockQuantity(stock)
                            .reservedQuantity(0)
                            .unit("adet")
                            .isActive(true)
                            .isFeatured(false)
                            .build();
                    productRepository.save(p);
                    created++;
                } catch (NumberFormatException nfe) {
                    errors.add(new BulkImportResult.RowError(rowNo, "Sayı format hatası: " + nfe.getMessage()));
                    skipped++;
                } catch (Exception ex) {
                    log.warn("CSV import row {} failed", rowNo, ex);
                    errors.add(new BulkImportResult.RowError(rowNo, ex.getMessage()));
                    skipped++;
                }
            }
        } catch (Exception e) {
            log.error("CSV import I/O failed", e);
            errors.add(new BulkImportResult.RowError(0, "Dosya okunamadı: " + e.getMessage()));
        }

        auditLogger.log("PRODUCT_BULK_IMPORT", "product", null,
                "total=" + total + " created=" + created + " skipped=" + skipped);

        return new BulkImportResult(total, created, skipped, errors);
    }

    private static int indexOf(String[] arr, String key) {
        for (int i = 0; i < arr.length; i++) if (arr[i].trim().equalsIgnoreCase(key)) return i;
        return -1;
    }

    private static String safe(String[] arr, int idx) {
        return idx < arr.length && arr[idx] != null ? arr[idx].trim() : "";
    }

    /** Basit CSV parser — virgül veya noktalı virgül, çift tırnak escape destekler. */
    static String[] parseRow(String line) {
        char sep = line.indexOf(';') > -1 && line.indexOf(',') < 0 ? ';' : ',';
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == sep && !inQuotes) {
                out.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        out.add(cur.toString());
        return out.toArray(new String[0]);
    }

    private static String slugify(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT);
        n = n.replaceAll("[^a-z0-9\\s-]", "").trim().replaceAll("\\s+", "-").replaceAll("-+", "-");
        return n.length() > 80 ? n.substring(0, 80) : n;
    }
}
