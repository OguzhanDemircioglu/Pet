package com.petshop.saas.dto;

import com.petshop.catalog.entity.Product;

import java.math.BigDecimal;

public record ProductDto(
        Long id,
        String name,
        String sku,
        BigDecimal price,
        Integer stock,
        Integer reserved,
        Boolean active
) {
    public static ProductDto from(Product p) {
        return new ProductDto(
                p.getId(),
                p.getName(),
                p.getSku(),
                p.getBasePrice(),
                p.getStockQuantity(),
                p.getReservedQuantity(),
                p.getIsActive()
        );
    }
}
