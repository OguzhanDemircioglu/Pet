package com.petshop.saas.dto;

import com.petshop.tenant.entity.Company.Plan;
import jakarta.validation.constraints.NotNull;

public record PlanUpgradeRequest(@NotNull Plan plan) {}
