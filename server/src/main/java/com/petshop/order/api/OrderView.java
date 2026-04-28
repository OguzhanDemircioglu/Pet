package com.petshop.order.api;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Cross-module snapshot of an order — sufficient for invoice/payment integrations
 * without exposing the Order JPA entity.
 */
public record OrderView(
        Long id,
        String orderNumber,
        Long userId,
        String guestEmail,
        String guestName,
        String guestPhone,
        String status,
        String paymentMethod,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal total,
        String shippingAddress,
        String shippingCity,
        String shippingDistrict,
        String shippingPostalCode,
        String invoiceType,
        String invoiceIdentityNo,
        String invoiceTitle,
        String invoiceTaxOffice,
        String invoiceAddress,
        String invoiceCity,
        String invoiceDistrict,
        String parasutContactId,
        String parasutInvoiceId,
        String parasutInvoiceStatus,
        String parasutEBelgeUrl,
        String iyzicoPaymentId,
        LocalDateTime refundedAt,
        String refundReason,
        LocalDateTime createdAt,
        List<OrderItemView> items
) {}
