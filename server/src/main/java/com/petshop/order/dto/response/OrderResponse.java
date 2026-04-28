package com.petshop.order.dto.response;

import com.petshop.auth.api.UserSummary;
import com.petshop.order.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record OrderResponse(
        Long id,
        String orderNumber,
        String status,
        String paymentMethod,
        BigDecimal totalAmount,
        String fullName,
        String phone,
        String city,
        String district,
        String address,
        List<OrderItemResponse> items,
        LocalDateTime createdAt,
        // Fatura
        String invoiceType,
        String parasutInvoiceStatus,
        String parasutEBelgeUrl,
        // İade
        LocalDateTime refundedAt,
        String refundReason
) {
    public static OrderResponse from(Order o) {
        return from(o, null);
    }

    public static OrderResponse from(Order o, UserSummary user) {
        List<OrderItemResponse> itemResponses = o.getItems() == null ? List.of() :
                o.getItems().stream()
                        .map(item -> new OrderItemResponse(
                                item.getProductId(),
                                item.getVariantId(),
                                item.getProductName(),
                                item.getVariantLabel(),
                                item.getQuantity(),
                                item.getUnitPrice()
                        ))
                        .collect(Collectors.toList());

        return new OrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getStatus() != null ? o.getStatus().name() : null,
                o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "COD",
                o.getTotal(),
                o.getGuestName() != null ? o.getGuestName()
                        : (user != null
                           ? (user.firstName() != null ? user.firstName() : "")
                                   + " "
                                   + (user.lastName() != null ? user.lastName() : "")
                           : null),
                o.getGuestPhone() != null ? o.getGuestPhone()
                        : (user != null ? user.phone() : null),
                o.getShippingCity(),
                o.getShippingDistrict(),
                o.getShippingAddress(),
                itemResponses,
                o.getCreatedAt(),
                o.getInvoiceType() != null ? o.getInvoiceType().name() : null,
                o.getParasutInvoiceStatus() != null ? o.getParasutInvoiceStatus().name() : null,
                o.getParasutEBelgeUrl(),
                o.getRefundedAt(),
                o.getRefundReason()
        );
    }
}
