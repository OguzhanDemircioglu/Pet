package com.petshop.dto.response;

import java.util.List;

public record CatalogResponse(
        List<CatalogProductDto> products,
        List<CategoryFlatResponse> categories,
        List<DiscountResponse> activeDiscounts,
        List<CampaignResponse> slides
) {}
