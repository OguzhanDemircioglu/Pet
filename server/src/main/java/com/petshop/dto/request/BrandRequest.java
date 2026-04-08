package com.petshop.dto.request;

import jakarta.validation.constraints.NotBlank;

public record BrandRequest(@NotBlank String name, Boolean isActive) {}
