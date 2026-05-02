package com.petshop.saas.dto;

import com.petshop.audit.entity.AuditLog;

import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        String action,
        String resourceType,
        Long resourceId,
        Long userId,
        String details,
        String ip,
        LocalDateTime createdAt
) {
    public static AuditLogDto from(AuditLog a) {
        return new AuditLogDto(
                a.getId(), a.getAction(), a.getResourceType(), a.getResourceId(),
                a.getUserId(), a.getDetails(), a.getIp(), a.getCreatedAt()
        );
    }
}
