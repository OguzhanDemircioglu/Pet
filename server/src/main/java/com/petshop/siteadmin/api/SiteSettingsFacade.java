package com.petshop.siteadmin.api;

public interface SiteSettingsFacade {
    SiteSettingsView getSettings();

    /** Convenience accessor for the brand+app name (used in email subjects/footers). */
    String getAppName();

    /** Convenience accessor for the marketing domain (used in invoice/email links). */
    String getAppDomain();

    /** Public endpoint için (frontend açılışında okunan ayarlar). */
    com.petshop.siteadmin.dto.response.SiteSettingsResponse getPublic();

    /** Public endpoint için: aktif kampanya slaytları (carousel). */
    java.util.List<com.petshop.siteadmin.dto.response.CampaignResponse> getActiveCampaigns();
}
