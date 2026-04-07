package com.offcats.dto.response;

import com.offcats.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record OrderResponse(
        Long id,
        String orderNumber,
        String status,
        BigDecimal totalAmount,
        String fullName,
        String phone,
        String city,
        String district,
        String address,
        List<OrderItemResponse> items,
        LocalDateTime createdAt
) {
    public static OrderResponse from(Order o) {
        List<OrderItemResponse> itemResponses = o.getItems() == null ? List.of() :
                o.getItems().stream()
                        .map(item -> new OrderItemResponse(
                                item.getProduct() != null ? item.getProduct().getId() : null,
                                item.getProductName(),
                                item.getQuantity(),
                                item.getUnitPrice()
                        ))
                        .collect(Collectors.toList());

        return new OrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getStatus() != null ? o.getStatus().name() : null,
                o.getTotal(),
                // fullName: guestName veya user adı
                o.getGuestName() != null ? o.getGuestName()
                        : (o.getUser() != null
                           ? o.getUser().getFirstName() + " " + o.getUser().getLastName()
                           : null),
                o.getGuestPhone() != null ? o.getGuestPhone()
                        : (o.getUser() != null ? o.getUser().getPhone() : null),
                o.getShippingCity(),
                o.getShippingDistrict(),
                o.getShippingAddress(),
                itemResponses,
                o.getCreatedAt()
        );
    }
}
