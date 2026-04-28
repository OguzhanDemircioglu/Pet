package com.petshop.order.api;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cross-module command for creating a pending order (e.g. from PaymentService during
 * iyzico checkout init). Mirrors the fields the order module itself fills into the
 * Order entity, but exposed as a record so consumers don't import the entity.
 */
public record CreateOrderCommand(
        Long userId,
        String paymentMethod,        // "COD" | "CREDIT_CARD"
        String guestEmail,
        String guestName,
        String guestPhone,
        String shippingAddress,
        String shippingCity,
        String shippingDistrict,
        String shippingPostalCode,
        String invoiceType,          // "INDIVIDUAL" | "CORPORATE" (nullable)
        String invoiceIdentityNo,
        String invoiceTitle,
        String invoiceTaxOffice,
        String invoiceAddress,
        String invoiceCity,
        String invoiceDistrict,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal total,
        List<CreateOrderItem> items
) {
    public record CreateOrderItem(
            Long productId,
            Long variantId,
            String productName,
            String productSku,
            String variantLabel,
            int quantity,
            BigDecimal unitPrice
    ) {}
}
