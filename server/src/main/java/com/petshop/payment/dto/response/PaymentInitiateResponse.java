package com.petshop.payment.dto.response;

public record PaymentInitiateResponse(Long orderId, String paymentPageUrl) {}
