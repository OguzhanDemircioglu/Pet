package com.petshop.dto.request;

import java.math.BigDecimal;

public record OrderItemRequest(
        Long productId,
        Long variantId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {}
