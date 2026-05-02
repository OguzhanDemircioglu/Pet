package com.petshop.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateApiKeyRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Size(max = 500) String scopes
) {}
