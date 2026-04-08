package com.petshop.repository;

import com.petshop.entity.CategoryDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryDiscountRepository extends JpaRepository<CategoryDiscount, Long> {

    @Query("SELECT d.emoji FROM CategoryDiscount d WHERE d.isActive = true AND d.emoji IS NOT NULL")
    List<String> findActiveEmojis();
}
