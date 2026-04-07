package com.offcats.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record CampaignRequest(
        @NotBlank String title,
        String badge,
        String description,
        String emoji,
        String sticker,
        String bgColor,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive
) {}
