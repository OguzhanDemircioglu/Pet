package com.petshop.notification.service;

import com.petshop.notification.constant.NotificationMessages;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.notification.dto.response.NotificationResponse;
import com.petshop.notification.entity.Notification;
import com.petshop.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markReadByIdAndUserId(notificationId, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException(NotificationMessages.NOT_FOUND.get());
        }
    }

    /** Kullanıcı için in-app bildirim oluşturur. */
    @Transactional
    public Notification createUserNotification(Long userId, String message, String type) {
        return notificationRepository.save(Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .isRead(false)
                .build());
    }

    /**
     * Admin kullanıcılar için sipariş bildirimi. Caller (order/payment modülü)
     * admin userId listesi + hazır mesajı geçirir — notification modülü
     * User/Order entity'lerine bağımlı olmadan çalışır.
     */
    @Transactional
    public void createAdminOrderNotifications(List<Long> adminUserIds, String message, Long relatedOrderId) {
        for (Long adminId : adminUserIds) {
            notificationRepository.save(Notification.builder()
                    .userId(adminId)
                    .message(message)
                    .type("ORDER_ACTION")
                    .isRead(false)
                    .relatedOrderId(relatedOrderId)
                    .build());
        }
    }
}
