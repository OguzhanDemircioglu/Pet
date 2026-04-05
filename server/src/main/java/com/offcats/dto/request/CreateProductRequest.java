package com.offcats.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank String name,
        @NotBlank String sku,
        @NotNull Long categoryId,
        String brandName,
        @NotNull @DecimalMin("0.01") BigDecimal basePrice,
        BigDecimal vatRate,
        Integer moq,
        Integer stockQuantity,
        String unit,
        String shortDescription,
        String description,
        Boolean isActive,
        Boolean isFeatured
) {}
