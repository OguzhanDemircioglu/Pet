package com.petshop.dto.response;

import com.petshop.entity.ProductReview;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        short rating,
        String comment,
        String userName,
        Long userId,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(ProductReview r) {
        String name = r.getUser() != null ? r.getUser().getFirstName() : "Misafir";
        Long uid  = r.getUser() != null ? r.getUser().getId() : null;
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(), name, uid, r.getCreatedAt());
    }
}
