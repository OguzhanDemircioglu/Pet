package com.petshop.job;

import com.petshop.repository.RefreshTokenRepository;
import com.petshop.repository.RequestLogRepository;
import com.petshop.repository.UserRepository;
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
    private final UserRepository userRepository;

    // Her gece 03:00'de çalışır
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredAndRevoked(LocalDateTime.now());
        log.info("Süresi dolmuş refresh token'lar temizlendi");
    }

    // Her gece 04:00'de 1 haftadır doğrulanmamış hesapları siler
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanupUnverifiedUsers() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        int deleted = userRepository.deleteUnverifiedBefore(cutoff);
        if (deleted > 0) log.info("{} doğrulanmamış hesap silindi", deleted);
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
