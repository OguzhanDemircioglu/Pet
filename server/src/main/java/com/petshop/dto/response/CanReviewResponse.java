package com.petshop.dto.response;

public record CanReviewResponse(
        boolean canReview,
        String reason,   // "not_ordered" | "already_reviewed" | "ok"
        Long orderId
) {}
