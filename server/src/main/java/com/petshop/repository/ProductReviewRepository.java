package com.petshop.repository;

import com.petshop.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductId(Long productId, Pageable pageable);
    Page<ProductReview> findByProductIdAndIsApprovedTrue(Long productId, Pageable pageable);
    Page<ProductReview> findByIsApprovedFalse(Pageable pageable);
    Optional<ProductReview> findByOrderIdAndProductId(Long orderId, Long productId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(Long productId);

    long countByProductId(Long productId);
    long countByProductIdAndIsApprovedTrue(Long productId);
}
