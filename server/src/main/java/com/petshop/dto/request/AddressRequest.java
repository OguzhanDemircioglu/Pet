package com.petshop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank @Size(max = 50) String title,
        @NotBlank String fullName,
        @NotBlank String phone,
        @NotBlank String city,
        @NotBlank String district,
        @NotBlank String addressLine,
        boolean isDefault
) {}
