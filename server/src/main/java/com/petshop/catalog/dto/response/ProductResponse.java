package com.petshop.catalog.dto.response;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.entity.ProductImage;
import com.petshop.catalog.entity.ProductVariant;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String sku,
        String shortDescription,
        String categoryName,
        String categorySlug,
        Long categoryId,
        Long brandId,
        String brandName,
        BigDecimal basePrice,
        Integer availableStock,
        String unit,
        Boolean isActive,
        Boolean isFeatured,
        String primaryImageUrl,
        Double averageRating,
        Integer reviewCount,
        List<ImageDto> images,
        ActiveDiscountDto activeDiscount,
        List<VariantDto> variants
) {
    public record ImageDto(Long id, String imageUrl, Boolean isPrimary, Integer displayOrder) {}
    public record ActiveDiscountDto(String label, String discountType, BigDecimal discountValue, String name) {}
    public record VariantDto(Long id, String label, BigDecimal price, Integer availableStock, Boolean isActive, Integer displayOrder) {}

    public static ProductResponse from(Product p) {
        return fromWithDiscount(p, null);
    }

    public static ProductResponse fromWithDiscount(Product p, ActiveDiscountDto discount) {
        return fromWithDetails(p, discount, null, null);
    }

    public static ProductResponse fromWithDetails(Product p, ActiveDiscountDto discount,
                                                   Double avgRating, Integer reviewCnt) {
        String primaryImage = p.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        List<ImageDto> images = p.getImages().stream()
                .map(i -> new ImageDto(i.getId(), i.getImageUrl(), i.getIsPrimary(), i.getDisplayOrder()))
                .toList();

        List<VariantDto> variants = p.getVariants().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .map(v -> new VariantDto(v.getId(), v.getLabel(), v.getPrice(), v.getAvailableStock(), v.getIsActive(), v.getDisplayOrder()))
                .toList();

        return new ProductResponse(
                p.getId(), p.getName(), p.getSlug(), p.getSku(),
                p.getShortDescription(),
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getCategory() != null ? p.getCategory().getSlug() : null,
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getBrand() != null ? p.getBrand().getId() : null,
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(),
                p.getAvailableStock(), p.getUnit(),
                p.getIsActive(), p.getIsFeatured(),
                primaryImage, avgRating, reviewCnt, images, discount, variants
        );
    }
}
