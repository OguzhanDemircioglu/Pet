package com.petshop.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stok geldiğinde haber verilecek e-postaları tutar.
 * Kullanıcı "Stoğa gelince haber ver" butonuna bastığında bir kayıt açılır.
 * Admin stok yüklediğinde (0 → pozitif) e-posta gider ve notifiedAt doldurulur.
 */
@Entity
@Table(name = "stock_notifications", schema = "petshop",
       indexes = {
           @Index(name = "idx_stock_notif_product", columnList = "product_id"),
           @Index(name = "idx_stock_notif_variant", columnList = "variant_id"),
           @Index(name = "idx_stock_notif_email",   columnList = "email")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    /** Ürünün varyantı yoksa null */
    @Column(name = "variant_id")
    private Long variantId;

    @Column(nullable = false, length = 150)
    private String email;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** E-posta gönderildikten sonra dolar; null iken "bekleyen" kayıt */
    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;
}
