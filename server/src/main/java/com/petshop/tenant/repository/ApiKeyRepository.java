package com.petshop.tenant.repository;

import com.petshop.tenant.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    Optional<ApiKey> findByKeyHash(String keyHash);
    Optional<ApiKey> findByIdAndCompanyId(Long id, Long companyId);
}
