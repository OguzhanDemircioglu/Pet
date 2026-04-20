package com.petshop.constant;

public enum ExceptionMessages {
    VALIDATION_ERROR("Validasyon hatası"),
    ACCESS_DENIED("Bu işlem için yetkiniz yok"),
    PAGE_NOT_FOUND("Sayfa bulunamadı"),
    UNEXPECTED_ERROR("Beklenmeyen bir hata oluştu");

    private final String message;
    ExceptionMessages(String message) { this.message = message; }
    public String get() { return message; }
}
