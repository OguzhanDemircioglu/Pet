package com.petshop.dto.response;

import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.catalog.dto.response.CatalogProductDto;
import com.petshop.catalog.dto.response.CategoryFlatResponse;
import com.petshop.siteadmin.dto.response.CampaignResponse;

import java.util.List;

public record CatalogResponse(
        List<CatalogProductDto> products,
        List<CategoryFlatResponse> categories,
        List<DiscountResponse> activeDiscounts,
        List<CampaignResponse> slides
) {}
