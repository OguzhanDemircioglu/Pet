package com.petshop.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteSettingsRequest(
        @NotBlank @Size(max = 60) String brandPart1,
        @NotBlank @Size(max = 60) String brandPart2,
        @NotBlank @Email @Size(max = 150) String contactEmail,
        @NotBlank @Size(max = 30) String contactPhone,
        @Size(max = 500) String companyAddress,
        @Size(max = 120) String contactHours,
        @Size(max = 50) String mapCoords,
        @NotBlank @Size(max = 100) String appDomain,
        @NotBlank @Size(max = 10) String appYear
) {}
