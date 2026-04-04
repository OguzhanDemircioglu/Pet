package com.offcats.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class NotificationService {

    private static final String TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage";

    @Value("${app.telegram.chat-id:}")
    private String chatId;

    @Value("${app.telegram.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendOrderNotification(String orderNumber, String productSummary,
                                      String shippingAddress, String total) {
        if (apiKey.isBlank() || chatId.isBlank()) {
            log.warn("Telegram bildirimi atlandı: api-key veya chat-id tanımlı değil");
            return;
        }

        String message = """
                🛒 Yeni Sipariş!
                📦 Sipariş No: %s
                🧾 Ürünler: %s
                📍 Adres: %s
                💰 Toplam: %s ₺
                """.formatted(orderNumber, productSummary, shippingAddress, total);

        String url = UriComponentsBuilder
                .fromUriString(TELEGRAM_API)
                .queryParam("chat_id", chatId)
                .queryParam("text", message)
                .buildAndExpand(apiKey)
                .toUriString();

        try {
            restTemplate.getForObject(url, String.class);
            log.info("Telegram bildirimi gönderildi — sipariş: {}", orderNumber);
        } catch (Exception e) {
            log.error("Telegram bildirimi gönderilemedi: {}", e.getMessage());
        }
    }
}
