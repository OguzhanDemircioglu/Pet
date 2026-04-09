package com.petshop.dto.response;

import com.petshop.entity.ProductReview;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        short rating,
        String comment,
        String userName,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(ProductReview r) {
        String name = r.getUser() != null
                ? r.getUser().getFirstName()
                : "Misafir";
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(), name, r.getCreatedAt());
    }
}
