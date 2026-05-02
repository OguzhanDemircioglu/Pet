package com.petshop.auth.service;

import com.petshop.auth.entity.PasswordResetToken;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.PasswordResetTokenRepository;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.notification.api.NotificationFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TOKEN_TTL_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationFacade notificationFacade;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Reset isteği — kullanıcı varsa token üretip e-posta gönderir.
     * E-posta gönderim/kullanıcı varlığı durumlarını caller'a sızdırmayız
     * (timing attack + user enumeration koruması). Her durumda 200 dönülür.
     */
    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Eski tokenları geçersiz kıl
            tokenRepository.invalidateAllForUser(user.getId());

            String token = generateToken();
            PasswordResetToken entity = PasswordResetToken.builder()
                    .userId(user.getId())
                    .token(token)
                    .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_TTL_MINUTES))
                    .used(false)
                    .build();
            tokenRepository.save(entity);

            String resetLink = frontendUrl.replaceAll("/$", "") + "/sifre-sifirla?token=" + token;
            try {
                notificationFacade.enqueuePasswordResetEmail(email, user.getFirstName(), resetLink);
            } catch (Exception e) {
                log.warn("Password reset e-posta kuyruğa atılamadı: {}", e.getMessage());
            }
        });
    }

    @Transactional
    public void confirmReset(String token, String newPassword) {
        PasswordResetToken entry = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException("Geçersiz veya süresi dolmuş bağlantı"));

        if (!entry.isValid()) {
            throw new BusinessException("Geçersiz veya süresi dolmuş bağlantı");
        }

        User user = userRepository.findById(entry.getUserId())
                .orElseThrow(() -> new BusinessException("Kullanıcı bulunamadı"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Tüm aktif oturumları geçersiz kıl
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        entry.setUsed(true);
        tokenRepository.save(entry);

        // Diğer açık reset tokenlarını da kapat
        tokenRepository.invalidateAllForUser(user.getId());
    }

    private static String generateToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
