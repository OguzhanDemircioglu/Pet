package com.petshop.catalog.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductVariantRequest(
        @NotBlank String label,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @Min(0) Integer stockQuantity,
        Integer displayOrder,
        Boolean isActive
) {}
