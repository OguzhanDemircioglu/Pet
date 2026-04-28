package com.petshop.pricing.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DiscountResponse(
        Long id,
        String type,           // "category" | "product" | "brand" | "general"
        String name,
        String emoji,
        String discountType,   // "PERCENT" | "FIXED"
        BigDecimal discountValue,
        String targetName,     // category/product/brand name, or coupon code for general
        Long targetId,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive,
        LocalDateTime createdAt,
        // General discount extra fields:
        String couponCode,
        BigDecimal minOrderAmount,
        Integer usageLimit,
        Integer usageCount
) {}
