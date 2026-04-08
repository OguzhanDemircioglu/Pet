package com.petshop.dto.request;

import com.petshop.entity.ProductDiscount;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DiscountUpdateRequest(
        @NotBlank String name,
        String emoji,
        @NotNull ProductDiscount.DiscountType discountType,
        @NotNull @DecimalMin("0.01") BigDecimal discountValue,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive
) {}
