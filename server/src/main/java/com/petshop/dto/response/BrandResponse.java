package com.petshop.dto.response;

import com.petshop.entity.Brand;

public record BrandResponse(Long id, String name, Boolean isActive) {
    public static BrandResponse from(Brand b) {
        return new BrandResponse(b.getId(), b.getName(), b.getIsActive());
    }
}
