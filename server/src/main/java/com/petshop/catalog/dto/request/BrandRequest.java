package com.petshop.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;

public record BrandRequest(@NotBlank String name, Boolean isActive) {}
