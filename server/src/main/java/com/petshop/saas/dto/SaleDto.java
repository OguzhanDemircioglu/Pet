package com.petshop.saas.dto;

import com.petshop.order.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SaleDto(
        Long id,
        String orderNumber,
        String customerName,
        BigDecimal total,
        Integer itemCount,
        LocalDateTime createdAt,
        List<Line> items
) {
    public record Line(Long productId, String name, Integer qty, BigDecimal unitPrice, BigDecimal lineTotal) {}

    public static SaleDto from(Order o) {
        List<Line> lines = o.getItems().stream()
                .map(it -> new Line(it.getProductId(), it.getProductName(), it.getQuantity(), it.getUnitPrice(), it.getLineTotal()))
                .toList();
        return new SaleDto(
                o.getId(),
                o.getOrderNumber(),
                o.getGuestName(),
                o.getTotal(),
                lines.size(),
                o.getCreatedAt(),
                lines
        );
    }
}
