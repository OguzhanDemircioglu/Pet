package com.petshop.saas.dto;

import java.math.BigDecimal;

public record MonthlyMetrics(
        String period,         // "2026-05"
        long totalSales,
        BigDecimal totalRevenue,
        BigDecimal averageOrderValue,
        long totalProducts,
        long activeProducts,
        long lowStockProducts,
        long inactiveProducts
) {}
