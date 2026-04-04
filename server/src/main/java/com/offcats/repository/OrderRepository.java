package com.offcats.repository;

import com.offcats.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByUserId(Long userId, Pageable pageable);
    List<Order> findByGuestEmail(String guestEmail);
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT MAX(o.orderNumber) FROM Order o WHERE o.orderNumber LIKE 'PT%'")
    Optional<String> findLastOrderNumber();
}
