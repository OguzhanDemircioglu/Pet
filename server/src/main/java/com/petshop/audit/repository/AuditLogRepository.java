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

    // All filter params required and non-null; callers pass sentinels for "any" —
    // ("" for strings, epoch/max for dates, -1 for resourceId). Avoids Postgres
    // failing to determine the type of a null-bound `:param IS NULL` placeholder.
    @org.springframework.data.jpa.repository.Query("""
        SELECT a FROM AuditLog a
        WHERE a.companyId = :cid
          AND (:resourceType = '' OR a.resourceType = :resourceType)
          AND (:action = '' OR a.action = :action)
          AND a.createdAt >= :from
          AND a.createdAt <= :to
          AND (:resourceId = -1 OR a.resourceId = :resourceId)
        ORDER BY a.createdAt DESC
        """)
    Page<AuditLog> search(
            @org.springframework.data.repository.query.Param("cid") Long companyId,
            @org.springframework.data.repository.query.Param("resourceType") String resourceType,
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
            @org.springframework.data.repository.query.Param("resourceId") Long resourceId,
            Pageable pageable);
}
