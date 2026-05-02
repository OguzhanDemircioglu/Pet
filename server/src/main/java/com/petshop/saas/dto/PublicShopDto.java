package com.petshop.saas.dto;

import java.util.List;

public record PublicShopDto(
        String name,
        String slug,
        List<ProductDto> products
) {}
