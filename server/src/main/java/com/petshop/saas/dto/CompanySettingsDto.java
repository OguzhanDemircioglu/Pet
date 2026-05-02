package com.petshop.saas.dto;

import com.petshop.tenant.entity.Company;

public record CompanySettingsDto(
        Long id,
        String name,
        String slug,
        String plan,
        Integer lowStockThreshold,
        Boolean lowStockAlertEnabled,
        Boolean dailySummaryEnabled,
        String notificationEmail
) {
    public static CompanySettingsDto from(Company c) {
        return new CompanySettingsDto(
                c.getId(), c.getName(), c.getSlug(), c.getPlan().name(),
                c.getLowStockThreshold(),
                Boolean.TRUE.equals(c.getLowStockAlertEnabled()),
                Boolean.TRUE.equals(c.getDailySummaryEnabled()),
                c.getNotificationEmail()
        );
    }
}
