package com.petshop.tenant.repository;

import com.petshop.tenant.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("SELECT c.plan FROM Company c WHERE c.id = :id")
    Optional<Company.Plan> findPlanById(@Param("id") Long id);
}
