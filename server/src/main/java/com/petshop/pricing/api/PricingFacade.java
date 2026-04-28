package com.petshop.pricing.api;

import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.siteadmin.dto.response.CampaignResponse;

import java.util.List;

/**
 * Public API of the pricing module — read-only operations exposed for the
 * public catalog endpoint and related cross-module consumers.
 */
public interface PricingFacade {

    /** Şu anda aktif olan tüm indirimler (public endpoint için). */
    List<DiscountResponse> getActiveDiscounts();

    /** Aktif indirimleri carousel slide formatında döndürür. */
    List<CampaignResponse> getActiveDiscountsAsSlides();
}
