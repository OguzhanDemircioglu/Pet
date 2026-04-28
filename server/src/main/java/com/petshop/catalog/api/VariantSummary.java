package com.petshop.catalog.api;

import java.math.BigDecimal;

public record VariantSummary(
        Long id,
        Long productId,
        String label,
        BigDecimal price,
        int availableStock,
        boolean active
) {}
