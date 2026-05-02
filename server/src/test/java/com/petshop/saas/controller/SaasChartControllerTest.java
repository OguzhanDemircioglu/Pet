package com.petshop.saas.controller;

import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.DailySalesPoint;
import com.petshop.saas.dto.TopSellerDto;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SaasChartControllerTest {

    private OrderRepository orderRepo;
    private SaasChartController controller;

    @BeforeEach
    void init() {
        orderRepo = mock(OrderRepository.class);
        controller = new SaasChartController(orderRepo);
        TenantContext.set(7L, "PRO");
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void salesDaily_fills_missing_days_with_zero() {
        // Bugün ve önceki gün için DB'de hiç veri yok — endpoint sıfır doldurmalı
        when(orderRepo.aggregateDailyByCompanySince(eq(7L), any())).thenReturn(List.of());

        var resp = controller.salesDaily(7);
        var body = resp.getBody();
        assertThat(body).isNotNull();
        List<DailySalesPoint> points = body.getData();

        assertThat(points).hasSize(7);
        // Hepsi sıfır
        assertThat(points).allMatch(p -> p.count() == 0L && p.total().signum() == 0);
        // Son gün bugün
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        assertThat(points.get(6).date()).isEqualTo(today);
    }

    @Test
    void salesDaily_merges_db_rows_with_zeros() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(new Object[] { today, 5L, new BigDecimal("250.00") });
        when(orderRepo.aggregateDailyByCompanySince(eq(7L), any())).thenReturn(rows);

        var points = controller.salesDaily(3).getBody().getData();
        assertThat(points).hasSize(3);
        // Bugün dolu, geri kalan boş
        var todayPoint = points.stream().filter(p -> p.date().equals(today)).findFirst().get();
        assertThat(todayPoint.count()).isEqualTo(5L);
        assertThat(todayPoint.total().compareTo(new BigDecimal("250.00"))).isZero();
    }

    @Test
    void salesDaily_clamps_days_to_valid_range() {
        when(orderRepo.aggregateDailyByCompanySince(any(), any())).thenReturn(List.of());

        // 0 → 1, çok büyük → 365
        assertThat(controller.salesDaily(0).getBody().getData()).hasSize(1);
        assertThat(controller.salesDaily(1000).getBody().getData()).hasSize(365);
    }

    @Test
    void topSellers_clamps_limit_and_maps_rows() {
        List<Object[]> tsRows = new java.util.ArrayList<>();
        tsRows.add(new Object[] { 10L, "Mama A", 50L, new BigDecimal("1000.00") });
        tsRows.add(new Object[] { 11L, "Mama B", 30L, new BigDecimal("600.00") });
        when(orderRepo.topSellersByCompanySince(eq(7L), any(), any())).thenReturn(tsRows);

        List<TopSellerDto> rows = controller.topSellers(30, 5).getBody().getData();
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).productId()).isEqualTo(10L);
        assertThat(rows.get(0).productName()).isEqualTo("Mama A");
        assertThat(rows.get(0).totalQuantity()).isEqualTo(50L);
        assertThat(rows.get(0).totalRevenue().compareTo(new BigDecimal("1000.00"))).isZero();
    }

    @Test
    void topSellers_respects_clamping() {
        when(orderRepo.topSellersByCompanySince(any(), any(), any())).thenReturn(List.of());

        controller.topSellers(0, 0);
        controller.topSellers(1000, 1000);

        verify(orderRepo, times(2)).topSellersByCompanySince(any(), any(), any());
    }
}
