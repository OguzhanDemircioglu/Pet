package com.petshop.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CatalogProductDto(
        Long id,
        String name,
        String slug,
        String sku,
        String shortDescription,
        Long categoryId,
        String categoryName,
        String categorySlug,
        Long brandId,
        String brandName,
        BigDecimal basePrice,
        BigDecimal vatRate,
        Integer availableStock,
        String unit,
        Boolean isActive,
        Boolean isFeatured,
        String primaryImageUrl,
        List<ImageDto> images,
        ActiveDiscountDto activeDiscount,
        List<VariantDto> variants
) {
    public record ImageDto(Long id, String imageUrl, Boolean isPrimary, Integer displayOrder) {}
    public record ActiveDiscountDto(String label, String discountType, BigDecimal discountValue) {}
    public record VariantDto(Long id, String label, BigDecimal price, Integer availableStock, Integer displayOrder, Boolean isActive) {}
}
