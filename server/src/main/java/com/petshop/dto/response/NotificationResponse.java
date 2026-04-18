package com.petshop.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.petshop.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String message,
        String type,
        @JsonProperty("isRead") boolean isRead,
        LocalDateTime createdAt,
        Long relatedOrderId
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt(),
                n.getRelatedOrderId()
        );
    }
}
