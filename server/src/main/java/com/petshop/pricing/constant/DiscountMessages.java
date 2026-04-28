package com.petshop.pricing.constant;

public enum DiscountMessages {
    TYPE_CATEGORY("category"),
    TYPE_PRODUCT("product"),
    TYPE_BRAND("brand"),
    TYPE_GENERAL("general"),
    INVALID_TYPE("Geçersiz indirim tipi: "),
    COUPON_VALID("Kupon geçerli"),
    COUPON_INVALID("Kupon geçersiz veya süresi dolmuş");

    private final String message;
    DiscountMessages(String message) { this.message = message; }
    public String get() { return message; }
}
