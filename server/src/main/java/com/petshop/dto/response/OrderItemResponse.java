package com.petshop.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        Long variantId,
        String productName,
        String variantLabel,
        Integer quantity,
        BigDecimal unitPrice
) {}
