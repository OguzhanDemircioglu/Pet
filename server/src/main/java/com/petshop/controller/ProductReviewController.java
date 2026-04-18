package com.petshop.controller;

import com.petshop.dto.request.ReviewRequest;
import com.petshop.dto.response.CanReviewResponse;
import com.petshop.dto.response.ReviewResponse;
import com.petshop.service.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products/{slug}/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> list(@PathVariable String slug) {
        return ResponseEntity.ok(reviewService.getApprovedReviews(slug));
    }

    @GetMapping("/can-review")
    public ResponseEntity<CanReviewResponse> canReview(
            @PathVariable String slug,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(reviewService.canReview(userId, slug));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> create(
            @PathVariable String slug,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(reviewService.addReview(userId, slug, req));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> update(
            @PathVariable String slug,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(reviewService.updateReview(userId, reviewId, req));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> delete(
            @PathVariable String slug,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId) {
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
