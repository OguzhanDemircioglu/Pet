package com.petshop.review.constant;

public enum ReviewMessages {
    PRODUCT_NOT_FOUND("Ürün bulunamadı: "),
    USER_NOT_FOUND("Kullanıcı bulunamadı"),
    ORDER_NOT_FOUND("Sipariş bulunamadı"),
    REVIEW_NOT_FOUND("Yorum bulunamadı: "),
    REVIEW_EDIT_FORBIDDEN("Bu yorumu düzenleme yetkiniz yok"),
    REVIEW_DELETE_FORBIDDEN("Bu yorumu silme yetkiniz yok"),
    STATUS_NOT_ORDERED("not_ordered"),
    STATUS_OK("ok"),
    STATUS_REVIEWED("already_reviewed");

    private final String message;
    ReviewMessages(String message) { this.message = message; }
    public String get() { return message; }
}
