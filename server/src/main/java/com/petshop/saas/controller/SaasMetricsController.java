package com.petshop.saas.controller;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.order.entity.Order;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.MonthlyMetrics;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Tenant'a özel iş metrikleri — actuator/metrics ile karıştırma:
 * o JVM/HTTP metrikleri içerir, bu ay-bazlı KPI'lar.
 */
@RestController
@RequestMapping("/admin/saas/metrics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasMetricsController {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @GetMapping("/monthly")
    public ResponseEntity<DataGenericResponse<MonthlyMetrics>> monthly(
            @RequestParam(required = false) String period) {
        Long cid = TenantContext.require();

        YearMonth ym = period != null ? YearMonth.parse(period) : YearMonth.now();
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.atEndOfMonth().atTime(23, 59, 59);

        // Aylık satışlar — searchByCompany null-friendly filter zaten var
        var orders = orderRepository.searchByCompany(cid, from, to, null, PageRequest.of(0, 10_000));
        long totalSales = orders.getTotalElements();
        BigDecimal totalRevenue = orders.getContent().stream()
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal aov = totalSales == 0
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(totalSales), 2, RoundingMode.HALF_UP);

        long totalProducts = productRepository.countByCompanyId(cid);
        List<com.petshop.catalog.entity.Product> all = productRepository
                .findByCompanyId(cid, PageRequest.of(0, 10_000)).getContent();
        long activeProducts = all.stream().filter(p -> Boolean.TRUE.equals(p.getIsActive())).count();
        long inactiveProducts = totalProducts - activeProducts;
        long lowStockProducts = all.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> (p.getStockQuantity() - p.getReservedQuantity()) <= 5)
                .count();

        return ResponseEntity.ok(DataGenericResponse.of(new MonthlyMetrics(
                ym.format(MONTH_FMT),
                totalSales,
                totalRevenue,
                aov,
                totalProducts,
                activeProducts,
                lowStockProducts,
                inactiveProducts
        )));
    }
}
