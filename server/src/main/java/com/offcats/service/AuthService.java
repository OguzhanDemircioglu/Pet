package com.offcats.service;

import com.offcats.dto.request.GoogleAuthRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.offcats.dto.request.LoginRequest;
import com.offcats.dto.request.RegisterRequest;
import com.offcats.dto.response.AuthResponse;
import com.offcats.dto.response.UserResponse;
import com.offcats.entity.RefreshToken;
import com.offcats.entity.User;
import com.offcats.exception.BusinessException;
import com.offcats.exception.ResourceNotFoundException;
import com.offcats.repository.RefreshTokenRepository;
import com.offcats.repository.UserRepository;
import com.offcats.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

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

        if (!user.getEmailVerified()) {
            throw new BusinessException("Lütfen önce e-posta adresinizi doğrulayın.");
        }

        return generateAuthResponse(user);
    }

    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException("Bu email adresi zaten kayıtlıdır.");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .phone(req.phone())
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .emailVerified(false)
                .verificationCode(code)
                .verificationCodeExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);
        emailService.sendVerificationCode(req.email(), req.firstName(), code);
    }

    @Transactional
    public AuthResponse verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Geçersiz e-posta adresi."));

        if (user.getEmailVerified()) {
            throw new BusinessException("E-posta zaten doğrulanmış.");
        }

        if (user.getVerificationCode() == null
                || !user.getVerificationCode().equals(code)) {
            throw new BusinessException("Doğrulama kodu hatalı.");
        }

        if (LocalDateTime.now().isAfter(user.getVerificationCodeExpiresAt())) {
            throw new BusinessException("Doğrulama kodunun süresi dolmuş.");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest req) {
        JsonNode info = fetchGoogleUserInfo(req.accessToken());

        String email = info.path("email").asText();
        String googleId = info.path("sub").asText();
        String firstName = info.path("given_name").asText("");
        String lastName = info.path("family_name").asText("");

        if (email.isBlank() || googleId.isBlank()) {
            throw new BusinessException("Google hesabından e-posta bilgisi alınamadı.");
        }

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
                            .firstName(firstName)
                            .lastName(lastName)
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

    private JsonNode fetchGoogleUserInfo(String accessToken) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                    .header("Authorization", "Bearer " + accessToken)
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BusinessException("Google token geçersiz veya süresi dolmuş.");
            }
            return new ObjectMapper().readTree(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (IOException | InterruptedException e) {
            log.error("Google userinfo fetch failed", e);
            throw new BusinessException("Google ile giriş başarısız");
        }
    }
}
