package com.petshop.review.dto.response;

import com.petshop.review.entity.ProductReview;

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
        String name = r.getUserFirstName() != null ? r.getUserFirstName() : "Misafir";
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(), name, r.getUserId(), r.getCreatedAt());
    }
}
