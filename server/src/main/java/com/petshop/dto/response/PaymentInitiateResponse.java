package com.petshop.dto.response;

public record PaymentInitiateResponse(Long orderId, String paymentPageUrl) {}
