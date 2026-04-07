package com.offcats.dto.request;

import java.math.BigDecimal;

public record OrderItemRequest(
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {}
