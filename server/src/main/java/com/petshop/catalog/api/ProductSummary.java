package com.petshop.catalog.api;

import java.math.BigDecimal;

/**
 * Cross-module snapshot of a product. Consumers must use this via {@link CatalogFacade}
 * rather than importing the Product entity.
 */
public record ProductSummary(
        Long id,
        String name,
        String slug,
        String sku,
        BigDecimal basePrice,
        int availableStock,
        boolean active,
        Long categoryId,
        Long brandId
) {}
