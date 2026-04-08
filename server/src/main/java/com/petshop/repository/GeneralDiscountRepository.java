package com.petshop.repository;

import com.petshop.entity.GeneralDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneralDiscountRepository extends JpaRepository<GeneralDiscount, Long> {

    Optional<GeneralDiscount> findByCouponCodeIgnoreCase(String couponCode);

    @Query("SELECT d.emoji FROM GeneralDiscount d WHERE d.isActive = true AND d.emoji IS NOT NULL")
    List<String> findActiveEmojis();
}
