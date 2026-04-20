package com.petshop.constant;

public enum OrderMessages {
    ORDER_RECEIVED("Sipariş alındı"),
    USER_NOT_FOUND("Kullanıcı bulunamadı: "),
    ORDER_NOT_FOUND("Sipariş bulunamadı: "),
    ORDER_ALREADY_CANCELLED("Bu sipariş zaten iptal edilmiş"),
    ORDER_NOTIFICATION_TEMPLATE("Siparişiniz #%d alındı. En kısa sürede sizinle iletişime geçeceğiz."),
    ORDER_NUMBER_PREFIX("PT"),
    LOG_ORDER_CREATED("Sipariş oluşturuldu: #{} — kullanıcı: {}"),
    LOG_NOTIF_FAIL("Bildirim kaydedilemedi (sipariş etkilenmedi): {}"),
    LOG_EMAIL_QUEUE_FAIL("Email kuyruğa alınamadı (sipariş etkilenmedi): {}"),
    LOG_TELEGRAM_QUEUE_FAIL("Telegram kuyruğa alınamadı (sipariş etkilenmedi): {}"),
    NOTIFICATION_TYPE_ORDER("ORDER");

    private final String message;
    OrderMessages(String message) { this.message = message; }
    public String get() { return message; }
    public String format(Object... args) { return String.format(message, args); }
}
