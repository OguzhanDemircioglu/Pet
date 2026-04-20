package com.petshop.controller;

import com.petshop.dto.request.GoogleAuthRequest;
import com.petshop.dto.request.LoginRequest;
import com.petshop.dto.request.RegisterRequest;
import com.petshop.dto.response.AuthResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.dto.response.UserResponse;
import com.petshop.service.AuthService;
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
    public ResponseEntity<DataGenericResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(authService.login(req)));
    }

    @PostMapping("/register")
    public ResponseEntity<GenericResponse> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(GenericResponse.ok("Doğrulama kodu e-posta adresinize gönderildi."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<DataGenericResponse<AuthResponse>> verifyEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code  = body.get("code");
        return ResponseEntity.ok(DataGenericResponse.of(authService.verifyEmail(email, code)));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<GenericResponse> resendVerification(@RequestBody Map<String, String> body) {
        authService.resendVerificationCode(body.get("email"));
        return ResponseEntity.ok(GenericResponse.ok("Doğrulama kodu tekrar gönderildi."));
    }

    @PostMapping("/google")
    public ResponseEntity<DataGenericResponse<AuthResponse>> google(@Valid @RequestBody GoogleAuthRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(authService.googleAuth(req)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<DataGenericResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        return ResponseEntity.ok(DataGenericResponse.of(authService.refreshToken(refreshToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<GenericResponse> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ResponseEntity.ok(GenericResponse.ok());
    }

    @GetMapping("/me")
    public ResponseEntity<DataGenericResponse<UserResponse>> me(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(DataGenericResponse.of(authService.me(userId)));
    }

    @PatchMapping("/me/phone")
    public ResponseEntity<DataGenericResponse<UserResponse>> updatePhone(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid PhoneRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(authService.updatePhone(userId, req.phone())));
    }

    record PhoneRequest(@NotBlank String phone) {}
}
