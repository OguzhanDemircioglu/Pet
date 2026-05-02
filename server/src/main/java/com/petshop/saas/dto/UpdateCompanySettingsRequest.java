package com.petshop.saas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateCompanySettingsRequest(
        @Size(min = 2, max = 200) String name,
        @Min(1) @Max(1000) Integer lowStockThreshold,
        Boolean lowStockAlertEnabled,
        Boolean dailySummaryEnabled,
        @Email @Size(max = 150) String notificationEmail
) {}
