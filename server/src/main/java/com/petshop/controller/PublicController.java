package com.petshop.controller;

import com.petshop.constant.SchedulerConstants;
import com.petshop.dto.response.*;
import com.petshop.entity.User;
import com.petshop.repository.UserRepository;
import com.petshop.service.CampaignService;
import com.petshop.service.CategoryService;
import com.petshop.service.DiscountService;
import com.petshop.service.ProductService;
import com.petshop.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final UserRepository userRepository;
    private final CampaignService campaignService;
    private final DiscountService discountService;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final SiteSettingsService siteSettingsService;

    @GetMapping("/site-settings")
    public ResponseEntity<DataGenericResponse<SiteSettingsResponse>> siteSettings() {
        return ResponseEntity.ok(DataGenericResponse.of(siteSettingsService.getPublic()));
    }

    @GetMapping("/health")
    public ResponseEntity<DataGenericResponse<String>> health() {
        return ResponseEntity.ok(DataGenericResponse.of("OK"));
    }

    /** Frontend doğrulama geri sayımı için backend sabiti */
    @GetMapping("/config")
    public ResponseEntity<DataGenericResponse<Map<String, Object>>> config() {
        Map<String, Object> cfg = Map.of(
            "verifyExpiryMinutes", SchedulerConstants.VERIFICATION_CODE_EXPIRY_MINUTES
        );
        return ResponseEntity.ok(DataGenericResponse.of(cfg));
    }

    @GetMapping("/admin-info")
    public ResponseEntity<DataGenericResponse<AdminInfoResponse>> adminInfo() {
        return userRepository.findFirstByRole(User.Role.ADMIN)
                .map(admin -> ResponseEntity.ok(DataGenericResponse.of(
                        new AdminInfoResponse(admin.getEmail(), admin.getPhone()))))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Carousel: bilgilendirme kampanyaları + indirim kampanyaları */
    @GetMapping("/campaigns")
    public ResponseEntity<DataGenericResponse<List<CampaignResponse>>> campaigns() {
        List<CampaignResponse> slides = new ArrayList<>(campaignService.getActiveCampaigns());
        slides.addAll(discountService.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(DataGenericResponse.of(slides));
    }

    /** Ürün kartlarında indirim badge'i için aktif indirimler */
    @GetMapping("/active-discounts")
    public ResponseEntity<DataGenericResponse<List<DiscountResponse>>> activeDiscounts() {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.getActiveDiscounts()));
    }

    /** Tüm aktif ürünler + kategoriler + indirimler + carousel slaytlar — arka plan preload */
    @GetMapping("/catalog")
    public ResponseEntity<DataGenericResponse<CatalogResponse>> catalog() {
        List<CampaignResponse> slides = new ArrayList<>(campaignService.getActiveCampaigns());
        slides.addAll(discountService.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(DataGenericResponse.of(new CatalogResponse(
                productService.getAllCatalog(),
                categoryService.getAllFlat(),
                discountService.getActiveDiscounts(),
                slides)));
    }

    /** Anasayfa için tek seferde kritik veri: öne çıkan ürünler */
    @GetMapping("/homepage")
    public ResponseEntity<DataGenericResponse<HomepageResponse>> homepage() {
        return ResponseEntity.ok(DataGenericResponse.of(new HomepageResponse(productService.getFeatured(8))));
    }
}
