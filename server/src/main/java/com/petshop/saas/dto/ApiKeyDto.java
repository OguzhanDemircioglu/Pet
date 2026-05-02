package com.petshop.saas.dto;

import com.petshop.tenant.entity.ApiKey;

import java.time.LocalDateTime;

public record ApiKeyDto(
        Long id,
        String name,
        String prefix,
        String lastFour,
        String scopes,
        LocalDateTime lastUsedAt,
        LocalDateTime revokedAt,
        LocalDateTime createdAt
) {
    public static ApiKeyDto from(ApiKey k) {
        return new ApiKeyDto(
                k.getId(), k.getName(), k.getPrefix(), k.getLastFour(),
                k.getScopes(), k.getLastUsedAt(), k.getRevokedAt(), k.getCreatedAt()
        );
    }
}
