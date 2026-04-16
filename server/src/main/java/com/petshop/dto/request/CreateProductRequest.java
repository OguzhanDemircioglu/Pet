package com.petshop.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank String name,
        @NotBlank String sku,
        @NotNull Long categoryId,
        Long brandId,
        @NotNull @DecimalMin("0.01") BigDecimal basePrice,
        BigDecimal vatRate,
        Integer minSellingQuantity,
        Integer stockQuantity,
        String unit,
        String shortDescription,
        String description,
        Boolean isActive,
        Boolean isFeatured
) {}
