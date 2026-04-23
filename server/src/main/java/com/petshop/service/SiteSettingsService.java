package com.petshop.service;

import com.petshop.dto.request.SiteSettingsRequest;
import com.petshop.dto.response.SiteSettingsResponse;
import com.petshop.entity.SiteSettings;
import com.petshop.repository.SiteSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Site genel ayarları — tekil kayıt (id=1).
 * Çok okunan ama nadiren değişen değerler olduğu için bellekte cache'lenir;
 * sadece uygulama başlangıcında ve update() sonrasında DB'ye gidilir.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SiteSettingsService {

    private static final Long SINGLETON_ID = 1L;

    private final SiteSettingsRepository repository;

    /** Bellek cache — volatile, update() çağrısı dışında DB'ye gitmez */
    private volatile SiteSettings cached;

    @PostConstruct
    void init() {
        // Uygulama açılışında bir kez yükle
        getCached();
    }

    /** DB'ye gitmeden memory'den okur (gerekirse ilk defa yükler) */
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
                    .brandPart1("My")
                    .brandPart2("Petshop")
                    .contactEmail("info@myPetshop.com.tr")
                    .contactPhone("905000000000")
                    .companyAddress("")
                    .contactHours("Haftaiçi 09:00–18:00")
                    .appDomain("mypetshop.com.tr")
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
        log.info("[SiteSettings.update] BEFORE: brand1={} brand2={} domain={} year={}",
                s.getBrandPart1(), s.getBrandPart2(), s.getAppDomain(), s.getAppYear());
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
        log.info("[SiteSettings.update] AFTER SAVE: id={} brand1={} brand2={} domain={} year={} updatedAt={}",
                saved.getId(), saved.getBrandPart1(), saved.getBrandPart2(),
                saved.getAppDomain(), saved.getAppYear(), saved.getUpdatedAt());
        this.cached = saved; // cache invalidation + refresh
        return toResponse(saved);
    }

    // Convenience getters — EmailService, NotificationOutboxService vb. için
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
