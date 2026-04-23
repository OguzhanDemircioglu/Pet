package com.petshop.dto.response;

public record SiteSettingsResponse(
        String brandPart1,
        String brandPart2,
        String contactEmail,
        String contactPhone,
        String companyAddress,
        String contactHours,
        String mapCoords,
        String appDomain,
        String appYear
) {}
