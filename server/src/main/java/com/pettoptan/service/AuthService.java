package com.pettoptan.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pettoptan.dto.request.GoogleAuthRequest;
import com.pettoptan.dto.request.LoginRequest;
import com.pettoptan.dto.request.RegisterRequest;
import com.pettoptan.dto.response.AuthResponse;
import com.pettoptan.dto.response.UserResponse;
import com.pettoptan.entity.RefreshToken;
import com.pettoptan.entity.User;
import com.pettoptan.exception.BusinessException;
import com.pettoptan.exception.ResourceNotFoundException;
import com.pettoptan.repository.RefreshTokenRepository;
import com.pettoptan.repository.UserRepository;
import com.pettoptan.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException("Email veya şifre hatalı"));

        if (user.getPasswordHash() == null) {
            throw new BusinessException("Bu hesap Google ile kayıtlıdır. Google ile giriş yapın.");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email veya şifre hatalı");
        }

        if (!user.getIsActive()) {
            throw new BusinessException("Hesabınız devre dışı bırakılmıştır.");
        }

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException("Bu email adresi zaten kayıtlıdır.");
        }

        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .emailVerified(false)
                .build();

        userRepository.save(user);
        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest req) {
        GoogleIdToken.Payload payload = verifyGoogleToken(req.idToken());

        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String firstName = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .map(u -> {
                    if (u.getGoogleId() == null) {
                        u.setGoogleId(googleId);
                        userRepository.save(u);
                    }
                    return u;
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .googleId(googleId)
                            .firstName(firstName != null ? firstName : "")
                            .lastName(lastName != null ? lastName : "")
                            .role(User.Role.CUSTOMER)
                            .isActive(true)
                            .emailVerified(true)
                            .build();
                    return userRepository.save(newUser);
                });

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken rt = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new BusinessException("Geçersiz refresh token"));

        if (rt.getIsRevoked() || rt.isExpired()) {
            throw new BusinessException("Refresh token süresi dolmuş veya iptal edilmiş");
        }

        rt.setIsRevoked(true);
        refreshTokenRepository.save(rt);

        return generateAuthResponse(rt.getUser());
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", userId));
        return UserResponse.from(user);
    }

    // ---- private helpers ----

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshTokenStr)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(rt);

        return new AuthResponse(accessToken, refreshTokenStr, UserResponse.from(user));
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BusinessException("Google token doğrulanamadı");
            }
            return token.getPayload();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new BusinessException("Google ile giriş başarısız");
        }
    }
}
