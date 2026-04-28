package com.petshop.notification.api;

import java.util.List;

/**
 * Public API of the notification module — covers in-app notifications,
 * transactional email enqueue, and Telegram admin alerts.
 */
public interface NotificationFacade {

    void notifyUser(Long userId, String message, String type);

    void notifyAdminsAboutOrder(List<Long> adminUserIds, String message, Long relatedOrderId);

    void enqueueVerificationEmail(String toEmail, String firstName, String code);

    void enqueueOrderConfirmationEmail(String toEmail, String firstName, Long orderId,
                                       String itemsHtml, String deliveryAddress, String totalAmount);

    void enqueueStockBackEmail(String toEmail, String productName, String variantLabel, String productUrl);

    void enqueueEmailChangeConfirmationEmail(String toEmail, String firstName, String confirmUrl);

    void enqueueTelegramMessage(String text);

    // ─── Stok abonelik (catalog modülünden çağrılır) ─────────────────────
    boolean isStockSubscribed(Long productId, Long variantId, String email);

    boolean subscribeToStock(Long productId, Long variantId, String email);
}
