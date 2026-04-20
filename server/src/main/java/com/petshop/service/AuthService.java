package com.petshop.service;

import com.petshop.constant.AuthMessages;
import com.petshop.constant.SchedulerConstants;
import com.petshop.entity.PendingEmailChange;
import com.petshop.repository.PendingEmailChangeRepository;
import com.petshop.dto.request.GoogleAuthRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petshop.dto.request.LoginRequest;
import com.petshop.dto.request.RegisterRequest;
import com.petshop.dto.response.AuthResponse;
import com.petshop.dto.response.UserResponse;
import com.petshop.entity.RefreshToken;
import com.petshop.entity.User;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.RefreshTokenRepository;
import com.petshop.repository.UserRepository;
import com.petshop.security.JwtTokenProvider;
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
    private final NotificationOutboxService notificationOutboxService;
    private final PendingEmailChangeRepository pendingEmailChangeRepository;

    @Value("${app.url}")
    private String appUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException(AuthMessages.INVALID_CREDENTIALS.get()));

        if (user.getPasswordHash() == null) {
            throw new BusinessException(AuthMessages.GOOGLE_ACCOUNT_NO_PASSWORD.get());
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException(AuthMessages.INVALID_CREDENTIALS.get());
        }

        if (!user.getIsActive()) {
            throw new BusinessException(AuthMessages.ACCOUNT_DISABLED.get());
        }

        if (!user.getEmailVerified()) {
            throw new BusinessException(AuthMessages.EMAIL_NOT_VERIFIED.get());
        }

        return generateAuthResponse(user);
    }

    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException(AuthMessages.EMAIL_ALREADY_EXISTS.get());
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
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(SchedulerConstants.VERIFICATION_CODE_EXPIRY_MINUTES))
                .build();

        userRepository.save(user);
        try {
            notificationOutboxService.enqueueVerificationCode(req.email(), req.firstName(), code);
        } catch (Exception e) {
            log.error(AuthMessages.LOG_EMAIL_QUEUE_FAIL.get(), e.getMessage());
        }
    }

    @Transactional
    public AuthResponse verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(AuthMessages.INVALID_EMAIL.get()));

        if (user.getEmailVerified()) {
            throw new BusinessException(AuthMessages.EMAIL_ALREADY_VERIFIED.get());
        }

        if (user.getVerificationCode() == null
                || !user.getVerificationCode().equals(code)) {
            throw new BusinessException(AuthMessages.INVALID_VERIFICATION_CODE.get());
        }

        if (LocalDateTime.now().isAfter(user.getVerificationCodeExpiresAt())) {
            throw new BusinessException(AuthMessages.VERIFICATION_CODE_EXPIRED.get());
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Transactional
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(AuthMessages.INVALID_EMAIL.get()));

        if (user.getEmailVerified()) {
            throw new BusinessException(AuthMessages.EMAIL_ALREADY_VERIFIED.get());
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(SchedulerConstants.VERIFICATION_CODE_EXPIRY_MINUTES));
        userRepository.save(user);

        try {
            notificationOutboxService.enqueueVerificationCode(email, user.getFirstName(), code);
        } catch (Exception e) {
            log.error(AuthMessages.LOG_EMAIL_QUEUE_FAIL.get(), e.getMessage());
        }
    }

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest req) {
        JsonNode info = fetchGoogleUserInfo(req.accessToken());

        String email = info.path("email").asText();
        String googleId = info.path("sub").asText();
        String firstName = info.path("given_name").asText("");
        String lastName = info.path("family_name").asText("");

        if (email.isBlank() || googleId.isBlank()) {
            throw new BusinessException(AuthMessages.GOOGLE_NO_EMAIL.get());
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
                .orElseThrow(() -> new BusinessException(AuthMessages.INVALID_REFRESH_TOKEN.get()));

        if (rt.getIsRevoked() || rt.isExpired()) {
            throw new BusinessException(AuthMessages.REFRESH_TOKEN_EXPIRED.get());
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
                .orElseThrow(() -> new ResourceNotFoundException(AuthMessages.USER_NOT_FOUND.get(), userId));
        boolean hasPending = pendingEmailChangeRepository.findByUserId(userId).isPresent();
        return UserResponse.from(user, hasPending);
    }

    @Transactional
    public UserResponse updatePhone(Long userId, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(AuthMessages.USER_NOT_FOUND.get(), userId));
        user.setPhone(phone);
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, String firstName, String lastName, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(AuthMessages.USER_NOT_FOUND.get(), userId));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        userRepository.save(user);
        return UserResponse.from(user);
    }

    // ---- private helpers ----

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getTokenVersion());

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
                throw new BusinessException(AuthMessages.GOOGLE_TOKEN_INVALID.get());
            }
            return new ObjectMapper().readTree(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (IOException | InterruptedException e) {
            log.error(AuthMessages.LOG_GOOGLE_FETCH_FAIL.get(), e);
            throw new BusinessException(AuthMessages.GOOGLE_AUTH_FAILED.get());
        }
    }

    @Transactional
    public void requestEmailChange(Long userId, String newEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(AuthMessages.USER_NOT_FOUND.get()));

        if (user.getEmail().equalsIgnoreCase(newEmail.trim())) {
            throw new BusinessException(AuthMessages.EMAIL_CHANGE_SAME.get());
        }
        if (userRepository.existsByEmail(newEmail.trim())) {
            throw new BusinessException(AuthMessages.EMAIL_CHANGE_IN_USE.get());
        }

        pendingEmailChangeRepository.deleteByUserId(userId);

        String token = UUID.randomUUID().toString();
        pendingEmailChangeRepository.save(PendingEmailChange.builder()
                .userId(userId)
                .newEmail(newEmail.trim())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build());

        String confirmUrl = appUrl + "/auth/me/email/confirm?token=" + token;
        String firstName = user.getFirstName() != null ? user.getFirstName() : user.getEmail();
        notificationOutboxService.enqueueEmailChangeConfirmation(newEmail.trim(), firstName, confirmUrl);
    }

    @Transactional
    public String confirmEmailChange(String token) {
        PendingEmailChange pending = pendingEmailChangeRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(AuthMessages.EMAIL_CHANGE_TOKEN_INVALID.get()));

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingEmailChangeRepository.delete(pending);
            throw new BusinessException(AuthMessages.EMAIL_CHANGE_TOKEN_INVALID.get());
        }

        User user = userRepository.findById(pending.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(AuthMessages.USER_NOT_FOUND.get()));

        user.setEmail(pending.getNewEmail());
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        pendingEmailChangeRepository.delete(pending);
        refreshTokenRepository.deleteAllByUserId(user.getId());

        log.info("E-posta değiştirildi: kullanıcı #{} → {}", user.getId(), user.getEmail());
        return frontendUrl + "/login?emailChanged=true";
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
