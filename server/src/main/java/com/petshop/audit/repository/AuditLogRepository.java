package com.petshop.audit.repository;

import com.petshop.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AuditLog a WHERE a.createdAt < :cutoff")
    int deleteOlderThan(@org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);

    @org.springframework.data.jpa.repository.Query("""
        SELECT a FROM AuditLog a
        WHERE a.companyId = :cid
          AND (:resourceType IS NULL OR a.resourceType = :resourceType)
          AND (:action IS NULL OR a.action = :action)
        ORDER BY a.createdAt DESC
        """)
    Page<AuditLog> search(
            @org.springframework.data.repository.query.Param("cid") Long companyId,
            @org.springframework.data.repository.query.Param("resourceType") String resourceType,
            @org.springframework.data.repository.query.Param("action") String action,
            Pageable pageable);
}
