package com.offcats.controller;

import com.offcats.dto.response.AdminInfoResponse;
import com.offcats.dto.response.CampaignResponse;
import com.offcats.dto.response.DiscountResponse;
import com.offcats.entity.User;
import com.offcats.repository.UserRepository;
import com.offcats.service.CampaignService;
import com.offcats.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final UserRepository userRepository;
    private final CampaignService campaignService;
    private final DiscountService discountService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
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
}
