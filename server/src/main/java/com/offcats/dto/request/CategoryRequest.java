package com.offcats.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String name,
        Long parentId,
        Integer displayOrder,
        String description
) {}
