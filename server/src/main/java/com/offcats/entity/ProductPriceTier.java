package com.offcats.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_price_tiers", schema = "petshop")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity;

    // null ise sınır yok (en son tier)
    @Column(name = "max_quantity")
    private Integer maxQuantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
}
