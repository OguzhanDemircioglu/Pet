package com.petshop.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Google access token zorunludur")
        String accessToken
) {}
