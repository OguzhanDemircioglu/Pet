package com.petshop.service;

import com.petshop.dto.request.ReviewRequest;
import com.petshop.dto.response.CanReviewResponse;
import com.petshop.dto.response.ReviewResponse;
import com.petshop.entity.Order;
import com.petshop.entity.Product;
import com.petshop.entity.ProductReview;
import com.petshop.entity.User;
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

    public List<ReviewResponse> getApprovedReviews(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + slug));
        return reviewRepository
                .findByProductIdAndIsApprovedTrue(product.getId(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public CanReviewResponse canReview(Long userId, String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + slug));

        List<Order> orders = orderRepository.findByUserIdAndProductId(userId, product.getId());
        if (orders.isEmpty()) {
            return new CanReviewResponse(false, "not_ordered", null);
        }

        // Check if already reviewed from any of these orders
        for (Order order : orders) {
            boolean alreadyReviewed = reviewRepository
                    .findByOrderIdAndProductId(order.getId(), product.getId())
                    .isPresent();
            if (!alreadyReviewed) {
                return new CanReviewResponse(true, "ok", order.getId());
            }
        }

        return new CanReviewResponse(false, "already_reviewed", null);
    }

    @Transactional
    public ReviewResponse addReview(Long userId, String slug, ReviewRequest req) {
        CanReviewResponse check = canReview(userId, slug);
        if (!check.canReview()) {
            throw new IllegalStateException(check.reason());
        }

        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + slug));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        Order order = orderRepository.findById(check.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı"));

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
