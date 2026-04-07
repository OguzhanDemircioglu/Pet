package com.offcats.dto.response;

import com.offcats.entity.Campaign;

import java.time.LocalDateTime;

public record CampaignResponse(
        Long id,
        String title,
        String badge,
        String description,
        String emoji,
        String sticker,
        String bgColor,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive,
        LocalDateTime createdAt
) {
    public static CampaignResponse from(Campaign c) {
        return new CampaignResponse(
                c.getId(), c.getTitle(), c.getBadge(), c.getDescription(),
                c.getEmoji(), c.getSticker(), c.getBgColor(),
                c.getStartDate(), c.getEndDate(), c.getIsActive(), c.getCreatedAt());
    }
}
