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
}
