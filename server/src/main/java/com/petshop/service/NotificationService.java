package com.petshop.service;

import com.petshop.dto.response.NotificationResponse;
import com.petshop.entity.Notification;
import com.petshop.entity.User;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.NotificationRepository;
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
            throw new ResourceNotFoundException("Bildirim bulunamadı");
        }
    }

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
