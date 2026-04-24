package com.petshop.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteSettingsRequest(
        @NotBlank @Size(max = 30) String brandPart1,
        @NotBlank @Size(max = 30) String brandPart2,
        @NotBlank @Email @Size(max = 100) String contactEmail,
        @NotBlank @Size(max = 20) String contactPhone,
        @Size(max = 255) String companyAddress,
        @Size(max = 60) String contactHours,
        @Size(max = 40) String mapCoords,
        @NotBlank @Size(max = 60) String appDomain,
        @NotBlank @Size(max = 4) String appYear
) {}
