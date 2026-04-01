package com.pettoptan.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Google ID token zorunludur")
        String idToken
) {}
