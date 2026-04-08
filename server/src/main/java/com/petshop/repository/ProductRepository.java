package com.petshop.repository;

import com.petshop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);
    Optional<Product> findBySku(String sku);

    Page<Product> findByIsActiveTrueAndCategoryId(Long categoryId, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
        AND (LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
             OR LOWER(p.sku) LIKE LOWER(CONCAT('%',:q,'%')))
        """)
    Page<Product> search(@Param("q") String query, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
        AND p.category.id IN :categoryIds
        """)
    Page<Product> findByCategoryIds(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);

    List<Product> findByIsFeaturedTrueAndIsActiveTrueOrderByCreatedAtDesc();

    List<Product> findByIsActiveTrueAndBrandId(Long brandId);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity - p.reservedQuantity > 0")
    Page<Product> findInStock(Pageable pageable);
}
