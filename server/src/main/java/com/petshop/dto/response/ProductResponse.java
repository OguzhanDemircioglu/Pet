package com.petshop.dto.response;

import com.petshop.entity.Product;
import com.petshop.entity.ProductImage;

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
        BigDecimal vatRate,
        Integer moq,
        Integer availableStock,
        String unit,
        Boolean isActive,
        Boolean isFeatured,
        String primaryImageUrl,
        List<PriceTierDto> priceTiers,
        Double averageRating,
        List<ImageDto> images,
        ActiveDiscountDto activeDiscount
) {
    public record PriceTierDto(Integer minQuantity, Integer maxQuantity, BigDecimal unitPrice) {}
    public record ImageDto(Long id, String imageUrl, Boolean isPrimary, Integer displayOrder) {}
    public record ActiveDiscountDto(String label, String discountType, BigDecimal discountValue, String name) {}

    public static ProductResponse from(Product p) {
        return fromWithDiscount(p, null);
    }

    public static ProductResponse fromWithDiscount(Product p, ActiveDiscountDto discount) {
        String primaryImage = p.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        List<PriceTierDto> tiers = p.getPriceTiers().stream()
                .map(t -> new PriceTierDto(t.getMinQuantity(), t.getMaxQuantity(), t.getUnitPrice()))
                .toList();

        List<ImageDto> images = p.getImages().stream()
                .map(i -> new ImageDto(i.getId(), i.getImageUrl(), i.getIsPrimary(), i.getDisplayOrder()))
                .toList();

        return new ProductResponse(
                p.getId(), p.getName(), p.getSlug(), p.getSku(),
                p.getShortDescription(),
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getCategory() != null ? p.getCategory().getSlug() : null,
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getBrand() != null ? p.getBrand().getId() : null,
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(), p.getVatRate(), p.getMoq(),
                p.getAvailableStock(), p.getUnit(),
                p.getIsActive(), p.getIsFeatured(),
                primaryImage, tiers, null, images, discount
        );
    }
}
