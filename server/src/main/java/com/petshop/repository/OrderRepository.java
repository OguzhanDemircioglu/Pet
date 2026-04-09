package com.petshop.repository;

import com.petshop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT MAX(o.orderNumber) FROM Order o WHERE o.orderNumber LIKE 'PT%'")
    Optional<String> findLastOrderNumber();

    @Query("SELECT o FROM Order o JOIN o.items i WHERE o.user.id = :userId AND i.product.id = :productId")
    List<Order> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
}
