package com.petshop.order.repository;

import com.petshop.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT MAX(o.orderNumber) FROM Order o WHERE o.orderNumber LIKE 'PT%'")
    Optional<String> findLastOrderNumber();

    @Query("SELECT o FROM Order o JOIN o.items i WHERE o.userId = :userId AND i.productId = :productId")
    List<Order> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("SELECT o.id FROM Order o JOIN o.items i WHERE o.userId = :userId AND i.productId = :productId AND o.status = :status ORDER BY o.id DESC")
    List<Long> findOrderIdsByUserProductStatus(@Param("userId") Long userId,
                                                @Param("productId") Long productId,
                                                @Param("status") Order.OrderStatus status);

    Optional<Order> findByIyzicoToken(String iyzicoToken);

    /**
     * En çok satan ürün ID'lerini döndürür (verilen sipariş durumları üzerinde).
     * Cross-module çağrı: catalog modülü best-seller listesi için OrderFacade üzerinden çağırır.
     * Her satır: [productId :: Long, totalQty :: Long] — totalQty desc.
     */
    @Query("""
        SELECT oi.productId, SUM(oi.quantity) AS total
        FROM OrderItem oi
        WHERE oi.order.status IN :statuses
        GROUP BY oi.productId
        ORDER BY total DESC
        """)
    List<Object[]> findBestSellerProductIdsByStatuses(
            @Param("statuses") java.util.Collection<Order.OrderStatus> statuses,
            org.springframework.data.domain.Pageable pageable);

    // ─── Tenant-aware (SaaS) ─────────────────────────────────────────────────

    long countByCompanyId(Long companyId);

    org.springframework.data.domain.Page<Order> findByCompanyIdOrderByCreatedAtDesc(Long companyId,
            org.springframework.data.domain.Pageable pageable);

    Optional<Order> findByIdAndCompanyId(Long id, Long companyId);

    List<Order> findTop10ByCompanyIdOrderByCreatedAtDesc(Long companyId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT FUNCTION('to_char', o.createdAt, 'YYYY-MM-DD') AS day,
               COUNT(o) AS cnt,
               COALESCE(SUM(o.total), 0) AS total
        FROM Order o
        WHERE o.companyId = :cid
          AND o.createdAt >= :since
        GROUP BY FUNCTION('to_char', o.createdAt, 'YYYY-MM-DD')
        ORDER BY day ASC
        """)
    List<Object[]> aggregateDailyByCompanySince(
            @org.springframework.data.repository.query.Param("cid") Long companyId,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("""
        SELECT o FROM Order o
        WHERE o.companyId = :cid
          AND (:from IS NULL OR o.createdAt >= :from)
          AND (:to   IS NULL OR o.createdAt <= :to)
          AND (:q    IS NULL OR LOWER(COALESCE(o.guestName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                              OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY o.createdAt DESC
        """)
    org.springframework.data.domain.Page<Order> searchByCompany(
            @org.springframework.data.repository.query.Param("cid") Long companyId,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
            @org.springframework.data.repository.query.Param("q") String q,
            org.springframework.data.domain.Pageable pageable);
}
