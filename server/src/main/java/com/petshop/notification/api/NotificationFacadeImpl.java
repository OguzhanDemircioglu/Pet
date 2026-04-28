package com.petshop.notification.api;

import com.petshop.notification.service.NotificationOutboxService;
import com.petshop.notification.service.NotificationService;
import com.petshop.notification.service.StockNotificationService;
import com.petshop.notification.service.TelegramOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
class NotificationFacadeImpl implements NotificationFacade {

    private final NotificationService notificationService;
    private final NotificationOutboxService notificationOutboxService;
    private final TelegramOutboxService telegramOutboxService;
    private final StockNotificationService stockNotificationService;

    @Override
    public void notifyUser(Long userId, String message, String type) {
        notificationService.createUserNotification(userId, message, type);
    }

    @Override
    public void notifyAdminsAboutOrder(List<Long> adminUserIds, String message, Long relatedOrderId) {
        notificationService.createAdminOrderNotifications(adminUserIds, message, relatedOrderId);
    }

    @Override
    public void enqueueVerificationEmail(String toEmail, String firstName, String code) {
        notificationOutboxService.enqueueVerificationCode(toEmail, firstName, code);
    }

    @Override
    public void enqueueOrderConfirmationEmail(String toEmail, String firstName, Long orderId,
                                              String itemsHtml, String deliveryAddress, String totalAmount) {
        notificationOutboxService.enqueueOrderConfirmation(toEmail, firstName, orderId,
                itemsHtml, deliveryAddress, totalAmount);
    }

    @Override
    public void enqueueStockBackEmail(String toEmail, String productName, String variantLabel, String productUrl) {
        notificationOutboxService.enqueueStockNotification(toEmail, productName, variantLabel, productUrl);
    }

    @Override
    public void enqueueEmailChangeConfirmationEmail(String toEmail, String firstName, String confirmUrl) {
        notificationOutboxService.enqueueEmailChangeConfirmation(toEmail, firstName, confirmUrl);
    }

    @Override
    public void enqueueTelegramMessage(String text) {
        telegramOutboxService.enqueue(text);
    }

    @Override
    public boolean isStockSubscribed(Long productId, Long variantId, String email) {
        return stockNotificationService.isSubscribed(productId, variantId, email);
    }

    @Override
    public boolean subscribeToStock(Long productId, Long variantId, String email) {
        return stockNotificationService.subscribe(productId, variantId, email);
    }
}
