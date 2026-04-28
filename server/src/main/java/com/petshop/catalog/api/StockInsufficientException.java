package com.petshop.catalog.api;

import com.petshop.exception.BusinessException;

/**
 * Thrown by {@link CatalogFacade} when a decrement/reservation cannot be satisfied
 * due to insufficient stock. Extends BusinessException so it gets standard 400 handling.
 */
public class StockInsufficientException extends BusinessException {
    private final Long productId;
    private final Long variantId;
    private final int requested;
    private final int available;

    public StockInsufficientException(String message, Long productId, Long variantId,
                                      int requested, int available) {
        super(message);
        this.productId = productId;
        this.variantId = variantId;
        this.requested = requested;
        this.available = available;
    }

    public Long getProductId()  { return productId; }
    public Long getVariantId()  { return variantId; }
    public int  getRequested()  { return requested; }
    public int  getAvailable()  { return available; }
}
