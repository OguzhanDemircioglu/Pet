package com.petshop.web;

import com.petshop.dto.response.AllowedRoutesResponse;
import com.petshop.dto.response.CatalogResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.dto.response.AdminInfoResponse;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.catalog.dto.response.FeaturedProductDto;
import com.petshop.catalog.dto.response.HomepageResponse;
import com.petshop.order.api.OrderFacade;
import com.petshop.pricing.api.PricingFacade;
import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.siteadmin.api.SiteSettingsFacade;
import com.petshop.siteadmin.dto.response.CampaignResponse;
import com.petshop.siteadmin.dto.response.SiteSettingsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Public read endpoints — composition layer over module facades.
 * Hiçbir modülün entity/repository/service'ine doğrudan erişmez; sadece api/* facade'lar.
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final AuthFacade authFacade;
    private final SiteSettingsFacade siteSettingsFacade;
    private final PricingFacade pricingFacade;
    private final CatalogFacade catalogFacade;
    private final OrderFacade orderFacade;

    @GetMapping("/site-settings")
    public ResponseEntity<DataGenericResponse<SiteSettingsResponse>> siteSettings() {
        return ResponseEntity.ok(DataGenericResponse.of(siteSettingsFacade.getPublic()));
    }

    @GetMapping("/health")
    public ResponseEntity<DataGenericResponse<String>> health() {
        return ResponseEntity.ok(DataGenericResponse.of("OK"));
    }

    /** Frontend doğrulama geri sayımı için backend sabiti */
    @GetMapping("/config")
    public ResponseEntity<DataGenericResponse<Map<String, Object>>> config() {
        Map<String, Object> cfg = Map.of(
            "verifyExpiryMinutes", authFacade.getVerificationCodeExpiryMinutes()
        );
        return ResponseEntity.ok(DataGenericResponse.of(cfg));
    }

    @GetMapping("/admin-info")
    public ResponseEntity<DataGenericResponse<AdminInfoResponse>> adminInfo() {
        return authFacade.findFirstAdminInfo()
                .map(info -> ResponseEntity.ok(DataGenericResponse.of(info)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Carousel: bilgilendirme kampanyaları + indirim kampanyaları */
    @GetMapping("/campaigns")
    public ResponseEntity<DataGenericResponse<List<CampaignResponse>>> campaigns() {
        List<CampaignResponse> slides = new ArrayList<>(siteSettingsFacade.getActiveCampaigns());
        slides.addAll(pricingFacade.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(DataGenericResponse.of(slides));
    }

    /** Ürün kartlarında indirim badge'i için aktif indirimler */
    @GetMapping("/active-discounts")
    public ResponseEntity<DataGenericResponse<List<DiscountResponse>>> activeDiscounts() {
        return ResponseEntity.ok(DataGenericResponse.of(pricingFacade.getActiveDiscounts()));
    }

    /** Tüm aktif ürünler + kategoriler + indirimler + carousel slaytlar — arka plan preload */
    @GetMapping("/catalog")
    public ResponseEntity<DataGenericResponse<CatalogResponse>> catalog() {
        List<CampaignResponse> slides = new ArrayList<>(siteSettingsFacade.getActiveCampaigns());
        slides.addAll(pricingFacade.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(DataGenericResponse.of(new CatalogResponse(
                catalogFacade.getAllCatalog(),
                catalogFacade.getAllFlatCategories(),
                pricingFacade.getActiveDiscounts(),
                slides)));
    }

    /**
     * Anasayfa için tek seferde 4 farklı ürün listesi:
     * öne çıkanlar, çok satanlar, yeni gelenler, fırsatlar.
     * Frontend tek HTTP request ile homepage'i render eder.
     */
    @GetMapping("/homepage")
    public ResponseEntity<DataGenericResponse<HomepageResponse>> homepage() {
        List<FeaturedProductDto> featured    = catalogFacade.getFeatured(8);
        List<Long> bestSellerIds             = orderFacade.findBestSellerProductIds(8);
        List<FeaturedProductDto> bestSellers = catalogFacade.getFeaturedByIds(bestSellerIds);
        List<FeaturedProductDto> newArrivals = catalogFacade.getNewArrivals(8);
        List<FeaturedProductDto> deals       = catalogFacade.getDeals(8);
        return ResponseEntity.ok(DataGenericResponse.of(
                new HomepageResponse(featured, bestSellers, newArrivals, deals)));
    }

    /** Frontend route whitelist — tanımsız URL'ler anasayfaya redirect edilir */
    @GetMapping("/allowed-routes")
    public ResponseEntity<DataGenericResponse<AllowedRoutesResponse>> allowedRoutes() {
        List<String> publicRoutes = List.of(
                "/login",
                "/hakkimizda",
                "/iletisim",
                "/sss",
                "/gizlilik-politikasi",
                "/odeme-sonuc"
        );
        List<String> customerRoutes = List.of(
                "/",
                "/urunler",
                "/urun/:slug",
                "/profil"
        );
        List<String> adminRoutes = List.of();
        return ResponseEntity.ok(DataGenericResponse.of(
                new AllowedRoutesResponse(publicRoutes, customerRoutes, adminRoutes)));
    }
}
