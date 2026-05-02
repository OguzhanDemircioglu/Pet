package com.petshop.saas.dto;

import java.util.List;

public record DashboardStats(
        long productCount,
        long salesCount,
        int productLimit,
        String plan,
        List<ProductDto> lowStock,
        List<SaleDto> recentSales
) {}
