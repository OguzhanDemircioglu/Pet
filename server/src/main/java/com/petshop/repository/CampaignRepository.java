package com.petshop.repository;

import com.petshop.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    @Query("SELECT c FROM Campaign c WHERE c.isActive = true AND (c.startDate IS NULL OR c.startDate <= :now) AND (c.endDate IS NULL OR c.endDate >= :now)")
    List<Campaign> findActiveCampaigns(@Param("now") LocalDateTime now);

    @Query("SELECT c.emoji FROM Campaign c WHERE c.isActive = true AND c.emoji IS NOT NULL")
    List<String> findActiveEmojis();
}
