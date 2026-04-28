package com.petshop.order.api;

import java.math.BigDecimal;

/**
 * Cross-module snapshot of an order item.
 */
public record OrderItemView(
        Long id,
        Long productId,
        Long variantId,
        String productName,
        String productSku,
        String variantLabel,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {}
