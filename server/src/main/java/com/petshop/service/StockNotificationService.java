package com.petshop.service;

import com.petshop.entity.Product;
import com.petshop.entity.ProductVariant;
import com.petshop.entity.StockNotification;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.ProductRepository;
import com.petshop.repository.ProductVariantRepository;
import com.petshop.repository.StockNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class StockNotificationService {

    private final StockNotificationRepository repo;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final NotificationOutboxService outbox;
    private final SiteSettingsService siteSettings;

    /** Kullanıcı bu ürün/varyant + e-posta kombinasyonu için zaten abone mi? */
    public boolean isSubscribed(Long productId, Long variantId, String email) {
        if (email == null || email.isBlank()) return false;
        return repo.findPending(productId, variantId, email.trim()).isPresent();
    }

    /**
     * Abonelik oluşturur. Aynı kombinasyon zaten varsa yeni kayıt açmaz (idempotent).
     * @return true = yeni kayıt açıldı, false = zaten mevcut
     */
    @Transactional
    public boolean subscribe(Long productId, Long variantId, String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-posta boş olamaz");
        }
        String normalized = email.trim();
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı", productId));
        if (variantId != null) {
            variantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Varyant bulunamadı", variantId));
        }
        if (repo.findPending(productId, variantId, normalized).isPresent()) {
            return false;
        }
        repo.save(StockNotification.builder()
                .productId(productId)
                .variantId(variantId)
                .email(normalized)
                .build());
        return true;
    }

    /**
     * Ürün seviyesi stok 0'dan pozitife geçtiğinde çağrılır.
     * Tüm bekleyen varyantsız abonelere mail yollar.
     */
    @Transactional
    public void notifyProductRestocked(Long productId) {
        List<StockNotification> pending = repo.findPendingByProduct(productId);
        if (pending.isEmpty()) return;
        Product p = productRepository.findById(productId).orElse(null);
        if (p == null) return;
        String url = buildProductUrl(p.getSlug());
        dispatch(pending, p.getName(), null, url);
    }

    /**
     * Varyant stok 0'dan pozitife geçtiğinde çağrılır.
     */
    @Transactional
    public void notifyVariantRestocked(Long variantId) {
        List<StockNotification> pending = repo.findPendingByVariant(variantId);
        if (pending.isEmpty()) return;
        ProductVariant v = variantRepository.findById(variantId).orElse(null);
        if (v == null || v.getProduct() == null) return;
        Product p = v.getProduct();
        String url = buildProductUrl(p.getSlug());
        dispatch(pending, p.getName(), v.getLabel(), url);
    }

    private void dispatch(List<StockNotification> list, String productName, String variantLabel, String url) {
        for (StockNotification n : list) {
            try {
                outbox.enqueueStockNotification(n.getEmail(), productName, variantLabel, url);
                n.setNotifiedAt(LocalDateTime.now());
                repo.save(n);
            } catch (Exception e) {
                log.warn("Stok bildirim kuyruğa alınamadı: id={}, email={}, err={}", n.getId(), n.getEmail(), e.getMessage());
            }
        }
    }

    private String buildProductUrl(String slug) {
        String appDomain = siteSettings.getAppDomain();
        String base = appDomain != null && !appDomain.isBlank()
                ? (appDomain.startsWith("http") ? appDomain : "https://" + appDomain)
                : "";
        return base + "/urun/" + slug;
    }
}
