package com.petshop.constant;

public enum ProductMessages {
    PRODUCT_NOT_FOUND("Ürün"),
    CATEGORY_NOT_FOUND("Kategori"),
    BRAND_NOT_FOUND("Marka"),
    PRODUCT_UPDATED("Ürün güncellendi"),
    DEFAULT_UNIT("adet");

    private final String message;
    ProductMessages(String message) { this.message = message; }
    public String get() { return message; }
}
