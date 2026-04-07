package com.offcats.repository;

import com.offcats.entity.ProductDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductDiscountRepository extends JpaRepository<ProductDiscount, Long> {

    @Query("SELECT d.emoji FROM ProductDiscount d WHERE d.isActive = true AND d.emoji IS NOT NULL")
    List<String> findActiveEmojis();
}
