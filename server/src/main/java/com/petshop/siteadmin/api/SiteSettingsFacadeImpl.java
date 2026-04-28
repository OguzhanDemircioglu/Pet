package com.petshop.siteadmin.api;

import com.petshop.siteadmin.dto.response.CampaignResponse;
import com.petshop.siteadmin.dto.response.SiteSettingsResponse;
import com.petshop.siteadmin.entity.SiteSettings;
import com.petshop.siteadmin.service.CampaignService;
import com.petshop.siteadmin.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
class SiteSettingsFacadeImpl implements SiteSettingsFacade {

    private final SiteSettingsService delegate;
    private final CampaignService campaignService;

    @Override
    public SiteSettingsView getSettings() {
        SiteSettings s = delegate.getCached();
        return new SiteSettingsView(
                nz(s.getBrandPart1()),
                nz(s.getBrandPart2()),
                nz(s.getAppDomain()),
                nz(s.getAppYear()),
                nz(s.getContactEmail()),
                nz(s.getContactPhone()),
                nz(s.getCompanyAddress()),
                nz(s.getContactHours())
        );
    }

    @Override
    public String getAppName()   { return delegate.getAppName(); }

    @Override
    public String getAppDomain() { return delegate.getAppDomain(); }

    @Override
    public SiteSettingsResponse getPublic() { return delegate.getPublic(); }

    @Override
    public List<CampaignResponse> getActiveCampaigns() { return campaignService.getActiveCampaigns(); }

    private static String nz(String v) { return v == null ? "" : v; }
}
