package com.petshop.dto.response;

import com.petshop.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String message,
        String type,
        boolean isRead,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
