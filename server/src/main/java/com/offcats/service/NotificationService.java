package com.offcats.service;

import com.offcats.dto.response.NotificationResponse;
import com.offcats.entity.Notification;
import com.offcats.entity.User;
import com.offcats.repository.NotificationRepository;
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

    /**
     * Kullanıcının tüm bildirimlerini en yeniden eskiye sıralar.
     */
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Kullanıcının tüm bildirimlerini okundu olarak işaretler.
     */
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    /**
     * Yeni bir bildirim kaydeder (OrderService tarafından çağrılır).
     */
    public Notification createNotification(User user, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }
}
