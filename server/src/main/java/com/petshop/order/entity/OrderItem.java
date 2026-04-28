package com.petshop.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items", schema = "petshop",
       indexes = {
           @Index(name = "idx_order_item_order",   columnList = "order_id"),
           @Index(name = "idx_order_item_product", columnList = "product_id")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Aggregate-internal (order module)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Cross-module ref: catalog
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName; // snapshot

    @Column(name = "product_sku", nullable = false, length = 100)
    private String productSku; // snapshot

    /** Seçilen varyant (nullable — varyantsız ürünler için null). Cross-module ref: catalog */
    @Column(name = "variant_id")
    private Long variantId;

    /** Sipariş anındaki varyant etiketi snapshot: "2 kg", "10 kg" */
    @Column(name = "variant_label", length = 100)
    private String variantLabel;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
