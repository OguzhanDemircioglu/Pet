package com.petshop.controller;

import com.petshop.constant.SchedulerConstants;
import com.petshop.dto.response.*;
import com.petshop.entity.User;
import com.petshop.repository.UserRepository;
import com.petshop.service.CampaignService;
import com.petshop.service.CategoryService;
import com.petshop.service.DiscountService;
import com.petshop.service.ProductService;
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

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    /** Frontend doğrulama geri sayımı için backend sabiti */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(Map.of(
            "verifyExpiryMinutes", SchedulerConstants.VERIFICATION_CODE_EXPIRY_MINUTES
        ));
    }

    @GetMapping("/admin-info")
    public ResponseEntity<AdminInfoResponse> adminInfo() {
        return userRepository.findFirstByRole(User.Role.ADMIN)
                .map(admin -> ResponseEntity.ok(new AdminInfoResponse(admin.getEmail(), admin.getPhone())))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Carousel: bilgilendirme kampanyaları + indirim kampanyaları */
    @GetMapping("/campaigns")
    public ResponseEntity<List<CampaignResponse>> campaigns() {
        List<CampaignResponse> slides = new ArrayList<>(campaignService.getActiveCampaigns());
        slides.addAll(discountService.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(slides);
    }

    /** Ürün kartlarında indirim badge'i için aktif indirimler */
    @GetMapping("/active-discounts")
    public ResponseEntity<List<DiscountResponse>> activeDiscounts() {
        return ResponseEntity.ok(discountService.getActiveDiscounts());
    }

    /** Tüm aktif ürünler + kategoriler + indirimler + carousel slaytlar — arka plan preload */
    @GetMapping("/catalog")
    public ResponseEntity<CatalogResponse> catalog() {
        List<CampaignResponse> slides = new ArrayList<>(campaignService.getActiveCampaigns());
        slides.addAll(discountService.getActiveDiscountsAsSlides());
        return ResponseEntity.ok(new CatalogResponse(
                productService.getAllCatalog(),
                categoryService.getAllFlat(),
                discountService.getActiveDiscounts(),
                slides
        ));
    }

    /** Anasayfa için tek seferde kritik veri: öne çıkan ürünler */
    @GetMapping("/homepage")
    public ResponseEntity<HomepageResponse> homepage() {
        return ResponseEntity.ok(new HomepageResponse(
                productService.getFeatured(8)
        ));
    }
}
