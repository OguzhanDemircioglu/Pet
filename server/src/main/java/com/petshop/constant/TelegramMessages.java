package com.petshop.constant;

public enum TelegramMessages {
    API_URL("https://api.telegram.org/bot%s/sendMessage"),
    SKIPPED("Telegram bildirimi atlandı: bot-token veya chat-id tanımlı değil"),
    SENT("Telegram mesajı gönderildi"),
    FAILED("Telegram mesajı gönderilemedi: {}");

    private final String message;
    TelegramMessages(String message) { this.message = message; }
    public String get() { return message; }
}
