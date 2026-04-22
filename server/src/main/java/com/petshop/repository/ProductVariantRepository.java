package com.petshop.repository;

import com.petshop.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductIdOrderByDisplayOrderAsc(Long productId);

    List<ProductVariant> findByProductIdAndIsActiveTrueOrderByDisplayOrderAsc(Long productId);

    Optional<ProductVariant> findByIdAndProductId(Long id, Long productId);

    @Query("SELECT v FROM ProductVariant v WHERE v.product.id IN :productIds AND v.isActive = true ORDER BY v.displayOrder ASC")
    List<ProductVariant> findActiveByProductIds(@Param("productIds") List<Long> productIds);

    boolean existsByProductId(Long productId);
}
