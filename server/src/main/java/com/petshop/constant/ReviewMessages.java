package com.petshop.constant;

public enum ReviewMessages {
    PRODUCT_NOT_FOUND("Ürün bulunamadı: "),
    USER_NOT_FOUND("Kullanıcı bulunamadı"),
    ORDER_NOT_FOUND("Sipariş bulunamadı"),
    STATUS_NOT_ORDERED("not_ordered"),
    STATUS_OK("ok"),
    STATUS_REVIEWED("already_reviewed");

    private final String message;
    ReviewMessages(String message) { this.message = message; }
    public String get() { return message; }
}
