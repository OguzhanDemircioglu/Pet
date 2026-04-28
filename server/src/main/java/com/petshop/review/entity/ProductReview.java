package com.petshop.review.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_reviews", schema = "petshop",
       indexes = {
           @Index(name = "idx_review_product_approved", columnList = "product_id,is_approved"),
           @Index(name = "idx_review_order_product",    columnList = "order_id,product_id", unique = true)
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cross-module ref: catalog */
    @Column(name = "product_id", nullable = false)
    private Long productId;

    /** Cross-module ref: order (nullable — guest review yok ama hız için) */
    @Column(name = "order_id")
    private Long orderId;

    /** Cross-module ref: auth */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    /** Snapshot — review oluşturma anındaki kullanıcı adı (cross-module call eliminate) */
    @Column(name = "user_first_name", length = 50)
    private String userFirstName;

    @Column(nullable = false)
    private Short rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
