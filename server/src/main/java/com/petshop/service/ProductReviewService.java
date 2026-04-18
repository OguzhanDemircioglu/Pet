package com.petshop.service;

import com.petshop.dto.request.ReviewRequest;
import com.petshop.dto.response.CanReviewResponse;
import com.petshop.dto.response.ReviewResponse;
import com.petshop.entity.Order;
import com.petshop.entity.Product;
import com.petshop.entity.ProductReview;
import com.petshop.entity.User;
import com.petshop.constant.ReviewMessages;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.OrderRepository;
import com.petshop.repository.ProductRepository;
import com.petshop.repository.ProductReviewRepository;
import com.petshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviews(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));
        return reviewRepository
                .findByProductId(product.getId(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public CanReviewResponse canReview(Long userId, String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));

        List<Order> orders = orderRepository.findByUserIdAndProductId(userId, product.getId());
        if (orders.isEmpty()) {
            return new CanReviewResponse(false, ReviewMessages.STATUS_NOT_ORDERED.get(), null);
        }

        // Check if already reviewed from any of these orders
        for (Order order : orders) {
            boolean alreadyReviewed = reviewRepository
                    .findByOrderIdAndProductId(order.getId(), product.getId())
                    .isPresent();
            if (!alreadyReviewed) {
                return new CanReviewResponse(true, ReviewMessages.STATUS_OK.get(), order.getId());
            }
        }

        return new CanReviewResponse(false, ReviewMessages.STATUS_REVIEWED.get(), null);
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest req) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Yorum bulunamadı", reviewId));
        if (review.getUser() == null || !review.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Bu yorumu düzenleme yetkiniz yok");
        }
        review.setRating(req.rating());
        review.setComment(req.comment());
        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Yorum bulunamadı", reviewId));
        if (review.getUser() == null || !review.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Bu yorumu silme yetkiniz yok");
        }
        reviewRepository.deleteById(reviewId);
    }

    @Transactional
    public ReviewResponse addReview(Long userId, String slug, ReviewRequest req) {
        CanReviewResponse check = canReview(userId, slug);
        if (!check.canReview()) {
            throw new IllegalStateException(check.reason());
        }

        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.PRODUCT_NOT_FOUND.get() + slug));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.USER_NOT_FOUND.get()));
        Order order = orderRepository.findById(check.orderId())
                .orElseThrow(() -> new ResourceNotFoundException(ReviewMessages.ORDER_NOT_FOUND.get()));

        ProductReview review = ProductReview.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(req.rating())
                .comment(req.comment())
                .isApproved(true)
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }
}
