package com.petshop.constant;

public enum ResponseMessages {
    SUCCESS("İşlem başarılı"),
    ORDER_CREATED("Sipariş alındı"),
    PRODUCT_UPDATED("Ürün güncellendi");

    private final String message;
    ResponseMessages(String message) { this.message = message; }
    public String get() { return message; }
}
