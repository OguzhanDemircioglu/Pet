package com.petshop.review.service;

import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.api.UserSummary;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.catalog.api.ProductSummary;
import com.petshop.review.constant.ReviewMessages;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.order.api.OrderFacade;
import com.petshop.review.dto.request.ReviewRequest;
import com.petshop.review.dto.response.CanReviewResponse;
import com.petshop.review.dto.response.ReviewResponse;
import com.petshop.review.entity.ProductReview;
import com.petshop.review.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Review modülü — ürün değerlendirme yazma + listeleme + onay süreci.
 *
 * Cross-module dep'ler (hepsi facade üzerinden):
 *  - {@link CatalogFacade}  ürün doğrulama + rating snapshot güncelleme
 *  - {@link OrderFacade}    review eligibility (DELIVERED sipariş içinde mi)
 *  - {@link AuthFacade}     userFirstName snapshot (review oluşturma anında)
 */
@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final CatalogFacade catalogFacade;
    private final OrderFacade orderFacade;
    private final AuthFacade authFacade;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviews(String slug) {
        // Catalog'dan slug → product map'i alıp productId çıkar
        ProductSummary product = catalogFacade.findProductBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));
        return reviewRepository
                .findByProductIdAndIsApprovedTrue(product.id(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public CanReviewResponse canReview(Long userId, String slug) {
        ProductSummary product = catalogFacade.findProductBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));

        Optional<Long> orderIdOpt = orderFacade.findDeliveredOrderIdContaining(userId, product.id());
        if (orderIdOpt.isEmpty()) {
            return new CanReviewResponse(false, ReviewMessages.STATUS_NOT_ORDERED.get(), null);
        }

        Long orderId = orderIdOpt.get();
        boolean alreadyReviewed = reviewRepository
                .findByOrderIdAndProductId(orderId, product.id())
                .isPresent();
        if (!alreadyReviewed) {
            return new CanReviewResponse(true, ReviewMessages.STATUS_OK.get(), orderId);
        }
        return new CanReviewResponse(false, ReviewMessages.STATUS_REVIEWED.get(), null);
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest req) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.REVIEW_NOT_FOUND.get() + reviewId));
        if (review.getUserId() == null || !review.getUserId().equals(userId)) {
            throw new BusinessException(ReviewMessages.REVIEW_EDIT_FORBIDDEN.get());
        }
        review.setRating(req.rating());
        review.setComment(req.comment());
        ProductReview saved = reviewRepository.save(review);
        recomputeProductRating(saved.getProductId());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.REVIEW_NOT_FOUND.get() + reviewId));
        if (review.getUserId() == null || !review.getUserId().equals(userId)) {
            throw new BusinessException(ReviewMessages.REVIEW_DELETE_FORBIDDEN.get());
        }
        Long productId = review.getProductId();
        reviewRepository.deleteById(reviewId);
        recomputeProductRating(productId);
    }

    @Transactional
    public ReviewResponse addReview(Long userId, String slug, ReviewRequest req) {
        CanReviewResponse check = canReview(userId, slug);
        if (!check.canReview()) {
            throw new BusinessException(check.reason());
        }
        ProductSummary product = catalogFacade.findProductBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));
        UserSummary user = authFacade.findUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.USER_NOT_FOUND.get()));

        ProductReview review = ProductReview.builder()
                .productId(product.id())
                .userId(user.id())
                .userFirstName(user.firstName())  // snapshot — display sırasında auth çağrısı gerekmez
                .orderId(check.orderId())
                .rating(req.rating())
                .comment(req.comment())
                .isApproved(true)
                .build();
        ProductReview saved = reviewRepository.save(review);
        recomputeProductRating(product.id());
        return ReviewResponse.from(saved);
    }

    /**
     * Product'ın avgRating + reviewCount snapshot'ını günceller (CatalogFacade üzerinden).
     * Add/update/delete sonrası çağrılır — UI tarafında ürün rating'i güncel kalır.
     */
    private void recomputeProductRating(Long productId) {
        if (productId == null) return;
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        long count = reviewRepository.countByProductIdAndIsApprovedTrue(productId);
        BigDecimal avgBd = avg == null
                ? null
                : BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
        catalogFacade.updateProductRating(productId, avgBd, (int) count);
    }
}
