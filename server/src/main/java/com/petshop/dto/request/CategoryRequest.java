package com.petshop.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String name,
        String emoji,
        Long parentId,
        Integer displayOrder,
        String description
) {}
