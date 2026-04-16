package com.petshop.constant;

public enum OutboxMessages {

    // Email outbox
    EMAIL_OUTBOX_PROCESSING("E-posta outbox işleniyor: {} kayıt"),
    EMAIL_SENT_JOB("E-posta gönderildi: {} (outbox id={})"),
    EMAIL_FAILED_PERMANENT("E-posta kalıcı olarak başarısız (id={}): {} — {}"),
    EMAIL_FAILED_RETRY("E-posta geçici hata, yeniden denenecek (id={}, deneme={}): {}"),
    EMAIL_INSTANT_SUCCESS("Anlık e-posta gönderildi: {} (outbox id={})"),
    EMAIL_INSTANT_FAIL("Anlık e-posta gönderilemedi (id={}): {}"),

    // Telegram outbox
    TELEGRAM_OUTBOX_PROCESSING("Telegram outbox işleniyor: {} kayıt"),
    TELEGRAM_SENT_JOB("Telegram mesajı gönderildi (outbox id={})"),
    TELEGRAM_FAILED_PERMANENT("Telegram mesajı kalıcı olarak başarısız (id={}): {}"),
    TELEGRAM_FAILED_RETRY("Telegram mesajı geçici hata, yeniden denenecek (id={}, deneme={}): {}");

    private final String message;
    OutboxMessages(String message) { this.message = message; }
    public String get() { return message; }
}
