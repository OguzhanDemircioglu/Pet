package com.petshop.constant;

public enum EmailMessages {
    SENT("Email gönderildi → {}"),
    FAILED("Email gönderilemedi → {}: {}"),
    SERVICE_ERROR("Email servis hatası: {}"),
    SUBJECT_VERIFY_SUFFIX(" — E-posta Doğrulama Kodunuz"),
    SUBJECT_ORDER_PREFIX("Siparişiniz Alındı - #");

    private final String message;
    EmailMessages(String message) { this.message = message; }
    public String get() { return message; }
}
