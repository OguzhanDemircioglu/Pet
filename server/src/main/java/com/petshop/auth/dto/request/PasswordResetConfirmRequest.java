package com.petshop.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {}
