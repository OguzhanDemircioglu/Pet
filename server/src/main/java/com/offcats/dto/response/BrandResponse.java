package com.offcats.dto.response;

import com.offcats.entity.Brand;

public record BrandResponse(Long id, String name, Boolean isActive) {
    public static BrandResponse from(Brand b) {
        return new BrandResponse(b.getId(), b.getName(), b.getIsActive());
    }
}
