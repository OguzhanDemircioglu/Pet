package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.DailySalesPoint;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard grafikleri için aggregation endpoint'leri.
 * Eksik günler 0 ile doldurulur — frontend kayan grafik çizebilir.
 */
@RestController
@RequestMapping("/admin/saas/charts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasChartController {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final OrderRepository orderRepository;

    @GetMapping("/sales-daily")
    public ResponseEntity<DataGenericResponse<List<DailySalesPoint>>> salesDaily(
            @RequestParam(defaultValue = "30") int days) {
        Long cid = TenantContext.require();
        int safeDays = Math.max(1, Math.min(days, 365));
        LocalDateTime since = LocalDate.now().minusDays(safeDays - 1L).atStartOfDay();

        List<Object[]> rows = orderRepository.aggregateDailyByCompanySince(cid, since);
        Map<String, Object[]> byDay = new HashMap<>();
        for (Object[] r : rows) byDay.put((String) r[0], r);

        List<DailySalesPoint> result = new ArrayList<>(safeDays);
        for (int i = 0; i < safeDays; i++) {
            LocalDate d = LocalDate.now().minusDays(safeDays - 1L - i);
            String key = d.format(DAY);
            Object[] r = byDay.get(key);
            if (r == null) {
                result.add(new DailySalesPoint(key, 0L, BigDecimal.ZERO));
            } else {
                long count = ((Number) r[1]).longValue();
                BigDecimal total = r[2] instanceof BigDecimal bd ? bd : new BigDecimal(r[2].toString());
                result.add(new DailySalesPoint(key, count, total));
            }
        }
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }

    @GetMapping("/top-sellers")
    public ResponseEntity<DataGenericResponse<List<com.petshop.saas.dto.TopSellerDto>>> topSellers(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "10") int limit) {
        Long cid = TenantContext.require();
        int safeDays = Math.max(1, Math.min(days, 365));
        int safeLimit = Math.max(1, Math.min(limit, 50));
        LocalDateTime since = LocalDate.now().minusDays(safeDays - 1L).atStartOfDay();

        List<Object[]> rows = orderRepository.topSellersByCompanySince(cid, since,
                org.springframework.data.domain.PageRequest.of(0, safeLimit));
        List<com.petshop.saas.dto.TopSellerDto> result = rows.stream()
                .map(r -> new com.petshop.saas.dto.TopSellerDto(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        ((Number) r[2]).longValue(),
                        r[3] instanceof BigDecimal bd ? bd : new BigDecimal(r[3].toString())
                )).toList();
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }
}
