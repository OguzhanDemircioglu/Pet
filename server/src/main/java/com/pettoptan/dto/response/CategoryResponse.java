package com.pettoptan.dto.response;

import com.pettoptan.entity.Category;

import java.util.List;
import java.util.Set;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String imageUrl,
        Integer displayOrder,
        List<CategoryResponse> children
) {
    public static CategoryResponse from(Category c) {
        List<CategoryResponse> children = c.getChildren() == null ? List.of() :
                c.getChildren().stream()
                        .filter(ch -> Boolean.TRUE.equals(ch.getIsActive()))
                        .map(CategoryResponse::fromShallow)
                        .toList();
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(),
                c.getImageUrl(), c.getDisplayOrder(), children);
    }

    public static CategoryResponse from(Category c, Set<Long> categoryIdsWithProducts) {
        List<CategoryResponse> children = c.getChildren() == null ? List.of() :
                c.getChildren().stream()
                        .filter(ch -> Boolean.TRUE.equals(ch.getIsActive())
                                && categoryIdsWithProducts.contains(ch.getId()))
                        .map(CategoryResponse::fromShallow)
                        .toList();
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(),
                c.getImageUrl(), c.getDisplayOrder(), children);
    }

    public static CategoryResponse fromShallow(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(),
                c.getImageUrl(), c.getDisplayOrder(), List.of());
    }
}
