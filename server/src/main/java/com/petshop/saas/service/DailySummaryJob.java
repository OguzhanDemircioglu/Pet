package com.petshop.saas.service;

import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.order.entity.Order;
import com.petshop.order.repository.OrderRepository;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Günlük satış özet email'i — her gün 18:00 (Avrupa/Istanbul).
 * - Sadece PRO/PRO+ + daily_summary_enabled=true
 * - Bugünün satış sayısı + toplam ciro
 * - Hiç satış yoksa email atılmaz (bilgi kirliliği)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DailySummaryJob {

    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final CompanyRepository companyRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationFacade notificationFacade;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Scheduled(cron = "0 0 18 * * *", zone = "Europe/Istanbul")
    public void runDailySummary() {
        log.info("DailySummaryJob başlıyor");
        for (Company c : companyRepository.findAll()) {
            try {
                if (!Boolean.TRUE.equals(c.getDailySummaryEnabled())) continue;
                if (c.getPlan() == Plan.FREE) continue;
                if (!Boolean.TRUE.equals(c.getIsActive())) continue;
                sendSummary(c);
            } catch (Exception e) {
                log.warn("Daily summary {} için başarısız: {}", c.getSlug(), e.getMessage());
            }
        }
        log.info("DailySummaryJob tamamlandı");
    }

    void sendSummary(Company c) {
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        var orders = orderRepository.searchByCompany(c.getId(), from, to, "", PageRequest.of(0, 1000));
        long count = orders.getTotalElements();
        if (count == 0) {
            log.debug("Daily summary atlandı (satış yok): {}", c.getSlug());
            return;
        }

        BigDecimal total = orders.getContent().stream()
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal aov = total.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP);

        String email = resolveEmail(c);
        if (email == null) {
            log.warn("Daily summary atlandı (email yok): {}", c.getSlug());
            return;
        }

        String intro = "Bugün <strong>" + count + " satış</strong> yapıldı, toplam <strong>" + total + " ₺</strong> ciro.";
        StringBuilder rows = new StringBuilder();
        for (Order o : orders.getContent().subList(0, Math.min(orders.getContent().size(), 10))) {
            rows.append("<tr><td style=\"padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px;color:#64748b\">")
                .append(escape(o.getOrderNumber()))
                .append("</td><td style=\"padding:6px 8px;border-bottom:1px solid #eee\">")
                .append(escape(o.getGuestName() == null ? "—" : o.getGuestName()))
                .append("</td><td style=\"padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600\">")
                .append(o.getTotal()).append(" ₺</td></tr>");
        }
        String table = """
            <p style="margin:16px 0 8px;font-size:13px;color:#64748b">
              Ortalama sepet: <strong>%s ₺</strong>
            </p>
            <table style="width:100%%;border-collapse:collapse;margin-top:8px;font-size:13px">
              <thead>
                <tr style="background:#f8f9fa">
                  <th style="padding:6px 8px;text-align:left;font-size:11px;color:#475569">Sipariş No</th>
                  <th style="padding:6px 8px;text-align:left;font-size:11px;color:#475569">Müşteri</th>
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#475569">Tutar</th>
                </tr>
              </thead>
              <tbody>%s</tbody>
            </table>
            """.formatted(aov.toPlainString(), rows.toString());

        String url = (frontendUrl == null ? "" : frontendUrl.replaceAll("/$", "")) + "/satislar";
        notificationFacade.enqueueSaasNotification(
                email,
                "Günlük Özet — " + c.getName() + " (" + today.format(D) + ")",
                "Bugünün Özeti",
                intro, table,
                "Satışları Görüntüle", url
        );
        log.info("Günlük özet email kuyruğa alındı: {} ({} satış / {} ₺)", c.getSlug(), count, total);
    }

    private String resolveEmail(Company c) {
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
