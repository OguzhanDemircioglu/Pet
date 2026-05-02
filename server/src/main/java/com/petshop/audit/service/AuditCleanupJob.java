package com.petshop.audit.service;

import com.petshop.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Audit log retention — 90 günden eski kayıtları siler.
 * Her gün 03:15'te (gece sakin saat) çalışır.
 *
 * Compliance gerekiyorsa retention env ile uzatılabilir, ya da
 * cold storage'a (S3) export edilebilir — şimdilik basit cleanup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditCleanupJob {

    private static final int RETENTION_DAYS = 90;

    private final AuditLogRepository repo;

    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void cleanup() {
        try {
            int deleted = repo.deleteOlderThan(LocalDateTime.now().minusDays(RETENTION_DAYS));
            if (deleted > 0) {
                log.info("Audit cleanup: {} kayıt silindi (>{} gün eski)", deleted, RETENTION_DAYS);
            }
        } catch (Exception e) {
            log.error("Audit cleanup başarısız", e);
        }
    }
}
