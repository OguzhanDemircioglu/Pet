package com.petshop.dto.response;

import java.math.BigDecimal;

public record FeaturedProductDto(
        Long id,
        String name,
        String slug,
        String brandName,
        BigDecimal basePrice,
        Integer minSellingQuantity,
        String unit,
        String primaryImageUrl,
        ActiveDiscountDto activeDiscount
) {
    public record ActiveDiscountDto(
            String label,
            String discountType,
            BigDecimal discountValue
    ) {}
}
