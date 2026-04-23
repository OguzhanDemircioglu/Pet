package com.petshop.repository;

import com.petshop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // ─── Detail queries (with JOIN FETCH) ────────────────────────────────────

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.slug = :slug")
    Optional<Product> findBySlugWithDetails(@Param("slug") String slug);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);

    // ─── Catalog / featured ───────────────────────────────────────────────────

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.images
        WHERE p.isFeatured = true AND p.isActive = true
        ORDER BY p.createdAt DESC
        """)
    List<Product> findFeaturedWithImages(Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.isActive = true ORDER BY p.name ASC")
    List<Product> findAllActiveWithImages();

    // ─── New arrivals (son 30 gün içinde eklenen aktif ürünler) ───────────────

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.images
        WHERE p.isActive = true AND p.createdAt >= :since
        ORDER BY p.createdAt DESC
        """)
    List<Product> findNewArrivalsWithImages(@Param("since") LocalDateTime since, Pageable pageable);

    // ─── Best sellers (sipariş kalemlerinden toplam satış adedine göre) ──────
    // Sadece iptal/iade edilmemiş siparişler sayılır.

    @Query("""
        SELECT oi.product.id, SUM(oi.quantity) AS total
        FROM OrderItem oi
        WHERE oi.order.status IN :statuses
          AND oi.product.isActive = true
        GROUP BY oi.product.id
        ORDER BY total DESC
        """)
    List<Object[]> findBestSellerProductIds(@Param("statuses") java.util.Collection<com.petshop.entity.Order.OrderStatus> statuses,
                                             Pageable pageable);

    // ─── Category / search (paginated — no collection fetch to avoid HHH90003004) ──

    @Query(value = "SELECT p FROM Product p WHERE p.isActive = true AND p.category.id = :categoryId",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.category.id = :categoryId")
    Page<Product> findByCategoryPaged(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query(value = """
        SELECT p FROM Product p
        WHERE p.isActive = true
          AND (LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
               OR LOWER(p.sku) LIKE LOWER(CONCAT('%',:q,'%')))
        """,
        countQuery = """
        SELECT COUNT(p) FROM Product p WHERE p.isActive = true
        AND (LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%'))
             OR LOWER(p.sku) LIKE LOWER(CONCAT('%',:q,'%')))
        """)
    Page<Product> searchPaged(@Param("q") String query, Pageable pageable);

    // Batch images fetch by IDs (second step of two-query pagination)
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
    List<Product> findByIdsWithImages(@Param("ids") List<Long> ids);

    // Batch variants fetch by IDs (used after findByIdsWithImages to avoid MultipleBagFetchException)
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants WHERE p.id IN :ids")
    List<Product> findByIdsWithVariants(@Param("ids") List<Long> ids);

    // ─── Discount map helpers (eliminates N+1 in buildDiscountMap) ────────────

    @Query("""
        SELECT p.id, bd.name, bd.discountType, bd.discountValue
        FROM Product p
        JOIN BrandDiscount bd ON p.brand.id = bd.brand.id
        WHERE p.isActive = true
          AND bd.isActive = true
          AND (bd.startDate IS NULL OR bd.startDate <= :now)
          AND (bd.endDate IS NULL OR bd.endDate >= :now)
        """)
    List<Object[]> findProductIdsWithBrandDiscounts(@Param("now") LocalDateTime now);

    @Query("""
        SELECT p.id, cd.name, cd.discountType, cd.discountValue
        FROM Product p
        JOIN CategoryDiscount cd ON p.category.id = cd.category.id
        WHERE p.isActive = true
          AND cd.isActive = true
          AND (cd.startDate IS NULL OR cd.startDate <= :now)
          AND (cd.endDate IS NULL OR cd.endDate >= :now)
        """)
    List<Object[]> findProductIdsWithCategoryDiscounts(@Param("now") LocalDateTime now);

    @Query("""
        SELECT pd.product.id, pd.name, pd.discountType, pd.discountValue
        FROM ProductDiscount pd
        WHERE pd.isActive = true
          AND (pd.startDate IS NULL OR pd.startDate <= :now)
          AND (pd.endDate IS NULL OR pd.endDate >= :now)
        """)
    List<Object[]> findActiveProductDiscounts(@Param("now") LocalDateTime now);

    // ─── Misc ─────────────────────────────────────────────────────────────────

    Optional<Product> findBySlug(String slug);
    Optional<Product> findBySku(String sku);

    // Used by admin category controller for product count
    Page<Product> findByIsActiveTrueAndCategoryId(Long categoryId, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
        AND p.category.id IN :categoryIds
        """)
    Page<Product> findByCategoryIds(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);

    List<Product> findByIsActiveTrueAndBrandId(Long brandId);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity - p.reservedQuantity > 0")
    Page<Product> findInStock(Pageable pageable);
}
