package com.petshop.pricing.api;

import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.pricing.service.DiscountService;
import com.petshop.siteadmin.dto.response.CampaignResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
class PricingFacadeImpl implements PricingFacade {

    private final DiscountService discountService;

    @Override
    public List<DiscountResponse> getActiveDiscounts() {
        return discountService.getActiveDiscounts();
    }

    @Override
    public List<CampaignResponse> getActiveDiscountsAsSlides() {
        return discountService.getActiveDiscountsAsSlides();
    }
}
