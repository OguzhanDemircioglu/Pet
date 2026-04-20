package com.petshop.constant;

public enum ProductMessages {
    PRODUCT_NOT_FOUND("Ürün"),
    CATEGORY_NOT_FOUND("Kategori"),
    BRAND_NOT_FOUND("Marka"),
    PRODUCT_UPDATED("Ürün güncellendi"),
    DEFAULT_UNIT("adet"),
    BRAND_ALREADY_EXISTS("Bu isimde marka zaten var"),
    CATEGORY_HAS_PRODUCTS("Bu kategoride ürün var, önce ürünleri taşıyın"),
    INSUFFICIENT_STOCK("Yetersiz stok: \"%s\" — mevcut: %d, istenen: %d");

    private final String message;
    ProductMessages(String message) { this.message = message; }
    public String get() { return message; }
    public String format(Object... args) { return String.format(message, args); }
}
