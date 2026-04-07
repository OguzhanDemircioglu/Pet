package com.offcats.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        String fullName,
        String phone,
        String city,
        String district,
        String address,
        BigDecimal totalAmount,
        List<OrderItemRequest> items
) {}
