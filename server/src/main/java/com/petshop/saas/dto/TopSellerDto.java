package com.petshop.saas.dto;

import java.math.BigDecimal;

public record TopSellerDto(
        Long productId,
        String productName,
        long totalQuantity,
        BigDecimal totalRevenue
) {}
