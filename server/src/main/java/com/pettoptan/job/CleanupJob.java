package com.pettoptan.job;

import com.pettoptan.repository.RefreshTokenRepository;
import com.pettoptan.repository.RequestLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupJob {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RequestLogRepository requestLogRepository;

    // Her gece 03:00'de çalışır
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredAndRevoked(LocalDateTime.now());
        log.info("Süresi dolmuş refresh token'lar temizlendi");
    }

    // Her Pazar gece 02:00'de 30 günden eski logları siler
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = requestLogRepository.deleteOlderThan(cutoff);
        log.info("{} eski request log silindi", deleted);
    }
}
