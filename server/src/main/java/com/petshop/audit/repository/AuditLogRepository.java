package com.petshop.audit.repository;

import com.petshop.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);
}
