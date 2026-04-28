package com.petshop.pricing.repository;

import com.petshop.pricing.entity.BrandDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandDiscountRepository extends JpaRepository<BrandDiscount, Long> {

    @Query("SELECT d.emoji FROM BrandDiscount d WHERE d.isActive = true AND d.emoji IS NOT NULL")
    List<String> findActiveEmojis();
}
