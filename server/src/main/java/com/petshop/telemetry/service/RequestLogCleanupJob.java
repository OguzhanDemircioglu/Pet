package com.petshop.telemetry.service;

import com.petshop.telemetry.repository.RequestLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Cross-cutting cleanup job — sadece RequestLog gibi telemetri tablolarını temizler.
 * Auth-related cleanup için bkz. {@link com.petshop.auth.service.AuthCleanupJob}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RequestLogCleanupJob {

    private final RequestLogRepository requestLogRepository;

    // Her Pazar gece 02:00'de 30 günden eski logları siler
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = requestLogRepository.deleteOlderThan(cutoff);
        log.info("{} eski request log silindi", deleted);
    }
}
