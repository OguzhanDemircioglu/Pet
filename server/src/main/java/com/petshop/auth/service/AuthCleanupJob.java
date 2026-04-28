package com.petshop.auth.service;

import com.petshop.auth.repository.PendingEmailChangeRepository;
import com.petshop.auth.repository.RefreshTokenRepository;
import com.petshop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Auth modülüne özgü scheduled cleanup job'ları.
 * (Auth-related cleanup — pending email changes, refresh tokens, unverified accounts.)
 *
 * Daha önce flat com.petshop.telemetry.service.RequestLogCleanupJob içinde toplanmıştı; modüler yapıda
 * auth tablolarına erişim auth modülü içinde olmalı (Spring Modulith encapsulation).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthCleanupJob {

    private final PendingEmailChangeRepository pendingEmailChangeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    // Her gece 03:00'de çalışır
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredPendingEmailChanges() {
        int deleted = pendingEmailChangeRepository.deleteExpiredBefore(LocalDateTime.now());
        if (deleted > 0) log.info("{} süresi dolmuş e-posta değişiklik isteği silindi", deleted);
    }

    @Scheduled(cron = "0 5 3 * * *")
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
}
