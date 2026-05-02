package com.petshop.saas.dto;

import com.petshop.tenant.entity.Company.Plan;

public record PlanInfoDto(
        Plan plan,
        Plan[] availablePlans,
        Long companyId,
        String companyName,
        String companySlug
) {}
