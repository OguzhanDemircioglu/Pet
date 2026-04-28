package com.petshop.review.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.review.dto.request.ReviewRequest;
import com.petshop.review.dto.response.CanReviewResponse;
import com.petshop.review.dto.response.ReviewResponse;
import com.petshop.review.service.ProductReviewService;
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
    public ResponseEntity<DataGenericResponse<List<ReviewResponse>>> list(@PathVariable String slug) {
        return ResponseEntity.ok(DataGenericResponse.of(reviewService.getApprovedReviews(slug)));
    }

    @GetMapping("/can-review")
    public ResponseEntity<DataGenericResponse<CanReviewResponse>> canReview(
            @PathVariable String slug,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(DataGenericResponse.of(reviewService.canReview(userId, slug)));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<ReviewResponse>> create(
            @PathVariable String slug,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(reviewService.addReview(userId, slug, req)));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<DataGenericResponse<ReviewResponse>> update(
            @PathVariable String slug,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(reviewService.updateReview(userId, reviewId, req)));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<GenericResponse> delete(
            @PathVariable String slug,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId) {
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
