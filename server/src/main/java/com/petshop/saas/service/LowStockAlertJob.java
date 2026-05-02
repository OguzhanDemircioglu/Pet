package com.petshop.saas.service;

import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Düşük stok bildirim job'u — her gün 09:00 (Avrupa/Istanbul).
 * - Sadece PRO/PRO+ planlı + low_stock_alert_enabled=true şirketler
 * - low_stock_threshold altındaki aktif ürünler bulunur
 * - Tek satır da olsa bildirim email'i kuyruğa alınır
 * - Bildirim email'i: company.notificationEmail, yoksa ilk admin email'i
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LowStockAlertJob {

    private final CompanyRepository companyRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationFacade notificationFacade;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Scheduled(cron = "0 0 9 * * *", zone = "Europe/Istanbul")
    public void runDailyAlerts() {
        log.info("LowStockAlertJob başlıyor");
        for (Company c : companyRepository.findAll()) {
            try {
                if (!Boolean.TRUE.equals(c.getLowStockAlertEnabled())) continue;
                if (c.getPlan() == Plan.FREE) continue; // PRO+ özellik
                if (!Boolean.TRUE.equals(c.getIsActive())) continue;
                checkAndSend(c);
            } catch (Exception e) {
                log.warn("Low stock alert {} için başarısız: {}", c.getSlug(), e.getMessage());
            }
        }
        log.info("LowStockAlertJob tamamlandı");
    }

    void checkAndSend(Company c) {
        int threshold = c.getLowStockThreshold() == null ? 5 : c.getLowStockThreshold();
        List<Product> low = productRepository.findLowStockByCompany(c.getId(), threshold, PageRequest.of(0, 100));
        if (low.isEmpty()) return;

        String email = resolveNotificationEmail(c);
        if (email == null) {
            log.warn("Low stock alert atlandı (email yok): company={}", c.getSlug());
            return;
        }

        StringBuilder rows = new StringBuilder();
        for (Product p : low) {
            int avail = p.getStockQuantity() - p.getReservedQuantity();
            rows.append("<tr><td style=\"padding:8px;border-bottom:1px solid #eee\">").append(escape(p.getName()))
                .append("</td><td style=\"padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px;color:#64748b\">").append(escape(p.getSku()))
                .append("</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#d97706\">").append(avail)
                .append("</td></tr>");
        }
        String table = """
            <table style="width:100%%;border-collapse:collapse;margin-top:12px;font-size:14px">
              <thead>
                <tr style="background:#f8f9fa">
                  <th style="padding:8px;text-align:left;color:#475569;font-size:12px;text-transform:uppercase">Ürün</th>
                  <th style="padding:8px;text-align:left;color:#475569;font-size:12px;text-transform:uppercase">SKU</th>
                  <th style="padding:8px;text-align:right;color:#475569;font-size:12px;text-transform:uppercase">Stok</th>
                </tr>
              </thead>
              <tbody>%s</tbody>
            </table>
            """.formatted(rows.toString());

        String intro = "<strong>" + low.size() + " ürün</strong> stokta tükenmek üzere (eşik: " + threshold + " adet ve altı).";
        String url = (frontendUrl == null ? "" : frontendUrl.replaceAll("/$", "")) + "/urunler";

        notificationFacade.enqueueSaasNotification(
                email,
                "Düşük Stok Uyarısı — " + c.getName(),
                "Düşük Stoklu Ürünler",
                intro, table,
                "Ürünleri Görüntüle", url
        );

        // Admin Telegram (opsiyonel — global ayar; tenant-bazlı değil — basit)
        try {
            StringBuilder tg = new StringBuilder("⚠️ *Düşük Stok* — ").append(c.getName()).append("\n");
            int show = Math.min(low.size(), 5);
            for (int i = 0; i < show; i++) {
                Product p = low.get(i);
                int avail = p.getStockQuantity() - p.getReservedQuantity();
                tg.append("• ").append(p.getName()).append(" — *").append(avail).append("* adet\n");
            }
            if (low.size() > show) tg.append("... ve ").append(low.size() - show).append(" ürün daha");
            notificationFacade.enqueueTelegramMessage(tg.toString());
        } catch (Exception ignored) {
            // Telegram opsiyonel — düşürmek hata verirse log'a düş
        }

        log.info("Düşük stok email kuyruğa alındı: {} ({} ürün)", c.getSlug(), low.size());
    }

    private String resolveNotificationEmail(Company c) {
        if (c.getNotificationEmail() != null && !c.getNotificationEmail().isBlank()) {
            return c.getNotificationEmail();
        }
        return userRepository.findByCompanyIdOrderByCreatedAtDesc(c.getId()).stream()
                .filter(u -> u.getRole() == User.Role.ADMIN && Boolean.TRUE.equals(u.getIsActive()))
                .map(User::getEmail)
                .findFirst()
                .orElse(null);
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
