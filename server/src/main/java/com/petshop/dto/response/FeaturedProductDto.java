package com.petshop.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record FeaturedProductDto(
        Long id,
        String name,
        String slug,
        String brandName,
        BigDecimal basePrice,
        Integer availableStock,
        String unit,
        String primaryImageUrl,
        ActiveDiscountDto activeDiscount,
        List<VariantDto> variants
) {
    public record ActiveDiscountDto(String label, String discountType, BigDecimal discountValue) {}
    public record VariantDto(Long id, String label, BigDecimal price, Integer availableStock, Integer displayOrder, Boolean isActive) {}
}
