package com.petshop.pricing.dto.response;

import java.math.BigDecimal;

public record CouponValidationResponse(
        boolean valid,
        String message,
        BigDecimal discountAmount,
        String discountType,
        String couponCode
) {}
