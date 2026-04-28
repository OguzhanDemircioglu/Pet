package com.petshop.siteadmin.api;

/**
 * Cross-module snapshot of site-wide branding settings (used by emails, invoices, etc.).
 */
public record SiteSettingsView(
        String brandPart1,
        String brandPart2,
        String appDomain,
        String appYear,
        String contactEmail,
        String contactPhone,
        String companyAddress,
        String contactHours
) {
    public String appName() {
        StringBuilder sb = new StringBuilder();
        if (brandPart1 != null) sb.append(brandPart1);
        if (brandPart2 != null) sb.append(brandPart2);
        return sb.toString();
    }
}
