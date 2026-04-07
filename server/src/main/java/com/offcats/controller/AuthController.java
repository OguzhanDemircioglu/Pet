package com.offcats.controller;

import com.offcats.dto.request.GoogleAuthRequest;
import com.offcats.dto.request.LoginRequest;
import com.offcats.dto.request.RegisterRequest;
import com.offcats.dto.response.AuthResponse;
import com.offcats.dto.response.UserResponse;
import com.offcats.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(Map.of("message", "Doğrulama kodu e-posta adresinize gönderildi."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code  = body.get("code");
        return ResponseEntity.ok(authService.verifyEmail(email, code));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleAuthRequest req) {
        return ResponseEntity.ok(authService.googleAuth(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(authService.me(userId));
    }

    @PatchMapping("/me/phone")
    public ResponseEntity<UserResponse> updatePhone(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid PhoneRequest req) {
        return ResponseEntity.ok(authService.updatePhone(userId, req.phone()));
    }

    record PhoneRequest(@NotBlank String phone) {}
}
