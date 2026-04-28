package com.petshop.catalog.dto.response;

import com.petshop.catalog.entity.ProductVariant;

import java.math.BigDecimal;

public record ProductVariantResponse(
        Long id,
        String label,
        BigDecimal price,
        Integer stockQuantity,
        Integer availableStock,
        Integer displayOrder,
        Boolean isActive
) {
    public static ProductVariantResponse from(ProductVariant v) {
        return new ProductVariantResponse(
                v.getId(),
                v.getLabel(),
                v.getPrice(),
                v.getStockQuantity(),
                v.getAvailableStock(),
                v.getDisplayOrder(),
                v.getIsActive()
        );
    }
}
