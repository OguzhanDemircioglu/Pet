package com.petshop.siteadmin.service;

import com.petshop.siteadmin.dto.request.SiteSettingsRequest;
import com.petshop.siteadmin.dto.response.SiteSettingsResponse;
import com.petshop.siteadmin.entity.SiteSettings;
import com.petshop.siteadmin.repository.SiteSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
@Slf4j
@RequiredArgsConstructor
public class SiteSettingsService {

    private static final Long SINGLETON_ID = 1L;

    private final SiteSettingsRepository repository;

    private volatile SiteSettings cached;

    @PostConstruct
    void init() {
        getCached();
    }

    public SiteSettings getCached() {
        SiteSettings local = cached;
        if (local == null) {
            synchronized (this) {
                if (cached == null) {
                    cached = loadOrCreate();
                }
                local = cached;
            }
        }
        return local;
    }

    @Transactional
    protected SiteSettings loadOrCreate() {
        return repository.findById(SINGLETON_ID).orElseGet(() -> {
            SiteSettings s = SiteSettings.builder()
                    .id(SINGLETON_ID)
                    .brandPart1("Pet")
                    .brandPart2("Toptan")
                    .contactEmail("")
                    .contactPhone("")
                    .companyAddress("")
                    .contactHours("")
                    .appDomain("")
                    .appYear(String.valueOf(Year.now().getValue()))
                    .build();
            return repository.save(s);
        });
    }

    public SiteSettingsResponse getPublic() {
        return toResponse(getCached());
    }

    @Transactional
    public SiteSettingsResponse update(SiteSettingsRequest req) {
        log.info("[SiteSettings.update] request={}", req);
        SiteSettings s = repository.findById(SINGLETON_ID).orElseGet(this::loadOrCreate);
        s.setBrandPart1(req.brandPart1().trim());
        s.setBrandPart2(req.brandPart2().trim());
        s.setContactEmail(req.contactEmail().trim());
        s.setContactPhone(req.contactPhone().trim());
        s.setCompanyAddress(req.companyAddress() == null ? "" : req.companyAddress().trim());
        s.setContactHours(req.contactHours() == null ? "" : req.contactHours().trim());
        s.setMapCoords(req.mapCoords() == null ? "" : req.mapCoords().trim());
        s.setAppDomain(req.appDomain().trim());
        s.setAppYear(req.appYear().trim());
        SiteSettings saved = repository.saveAndFlush(s);
        this.cached = saved;
        return toResponse(saved);
    }

    public String getAppName() {
        SiteSettings s = getCached();
        return nz(s.getBrandPart1()) + nz(s.getBrandPart2());
    }

    public String getAppNamePart1() { return nz(getCached().getBrandPart1()); }
    public String getAppNamePart2() { return nz(getCached().getBrandPart2()); }
    public String getAppDomain()    { return nz(getCached().getAppDomain()); }
    public String getAppYear()      { return nz(getCached().getAppYear()); }

    private static String nz(String v) { return v == null ? "" : v; }

    private SiteSettingsResponse toResponse(SiteSettings s) {
        return new SiteSettingsResponse(
                nz(s.getBrandPart1()),
                nz(s.getBrandPart2()),
                nz(s.getContactEmail()),
                nz(s.getContactPhone()),
                nz(s.getCompanyAddress()),
                nz(s.getContactHours()),
                nz(s.getMapCoords()),
                nz(s.getAppDomain()),
                nz(s.getAppYear())
        );
    }
}
