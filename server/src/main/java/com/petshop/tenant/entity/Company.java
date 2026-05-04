package com.petshop.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies", schema = "petshop",
       uniqueConstraints = @UniqueConstraint(columnNames = "slug"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Plan plan = Plan.FREE;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** Düşük stok alarm eşiği (varsayılan 5). Email alert + dashboard low-stock listesi bunu kullanır. */
    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    /** PRO+: günlük 09:00 düşük stok özeti email'i gönderilsin mi? */
    @Column(name = "low_stock_alert_enabled", nullable = false)
    @Builder.Default
    private Boolean lowStockAlertEnabled = false;

    /** PRO+: günlük 18:00 satış özeti email'i. */
    @Column(name = "daily_summary_enabled", nullable = false)
    @Builder.Default
    private Boolean dailySummaryEnabled = false;

    /** Bildirim e-postası — boşsa şirketin ilk admin user email'i kullanılır. */
    @Column(name = "notification_email", length = 150)
    private String notificationEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Plan {
        FREE, PRO, PRO_PLUS;

        public boolean atLeast(Plan other) {
            return this.ordinal() >= other.ordinal();
        }
    }
}
