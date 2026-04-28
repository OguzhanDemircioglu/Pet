package com.petshop.siteadmin.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.petshop.siteadmin.entity.Campaign;

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
        @JsonProperty("isActive") Boolean isActive,
        LocalDateTime createdAt,
        String sourceType
) {
    public static CampaignResponse from(Campaign c) {
        return new CampaignResponse(
                c.getId(), c.getTitle(), c.getBadge(), c.getDescription(),
                c.getEmoji(), c.getSticker(), c.getBgColor(),
                c.getStartDate(), c.getEndDate(), c.getIsActive(), c.getCreatedAt(),
                "info");
    }

    public static CampaignResponse discount(String title, String badge, String description,
                                             String emoji, String bgColor) {
        return new CampaignResponse(
                null, title, badge, description, emoji, null, bgColor,
                null, null, true, null, "discount");
    }
}
