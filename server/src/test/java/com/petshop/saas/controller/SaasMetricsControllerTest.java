package com.petshop.saas.controller;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.order.entity.Order;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.MonthlyMetrics;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SaasMetricsControllerTest {

    private OrderRepository orderRepo;
    private ProductRepository productRepo;
    private SaasMetricsController controller;

    @BeforeEach
    void init() {
        orderRepo = mock(OrderRepository.class);
        productRepo = mock(ProductRepository.class);
        controller = new SaasMetricsController(orderRepo, productRepo);
        TenantContext.set(7L, "PRO");
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private Order order(BigDecimal total) {
        return Order.builder().id(1L).companyId(7L).orderNumber("X")
                .subtotal(total).discountAmount(BigDecimal.ZERO).total(total)
                .status(Order.OrderStatus.PAID).paymentMethod(Order.PaymentMethod.COD).build();
    }

    private Product product(int stock, int reserved, boolean active) {
        return Product.builder().id(1L).companyId(7L).name("X").sku("X")
                .basePrice(BigDecimal.ONE).stockQuantity(stock).reservedQuantity(reserved)
                .isActive(active).isFeatured(false).build();
    }

    @Test
    void monthly_with_no_sales_returns_zeros() {
        when(orderRepo.searchByCompany(eq(7L), any(), any(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));
        when(productRepo.countByCompanyId(7L)).thenReturn(5L);
        when(productRepo.findByCompanyId(eq(7L), any()))
                .thenReturn(new PageImpl<>(List.of()));

        MonthlyMetrics m = controller.monthly(null).getBody().getData();
        assertThat(m.totalSales()).isZero();
        assertThat(m.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(m.averageOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(m.totalProducts()).isEqualTo(5L);
    }

    @Test
    void monthly_calculates_aov_correctly() {
        Page<Order> orders = new PageImpl<>(
                List.of(order(new BigDecimal("100")), order(new BigDecimal("200")), order(new BigDecimal("300"))),
                Pageable.unpaged(), 3);
        when(orderRepo.searchByCompany(eq(7L), any(), any(), isNull(), any())).thenReturn(orders);
        when(productRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of()));

        MonthlyMetrics m = controller.monthly(null).getBody().getData();
        assertThat(m.totalSales()).isEqualTo(3L);
        assertThat(m.totalRevenue()).isEqualByComparingTo(new BigDecimal("600"));
        assertThat(m.averageOrderValue()).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    void monthly_separates_active_inactive_low_stock_products() {
        when(orderRepo.searchByCompany(eq(7L), any(), any(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));
        when(productRepo.countByCompanyId(7L)).thenReturn(4L);
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(
                product(20, 0, true),    // aktif, normal stok
                product(3, 0, true),     // aktif, düşük stok (≤5)
                product(0, 0, true),     // aktif, düşük stok
                product(50, 0, false)    // pasif
        )));

        MonthlyMetrics m = controller.monthly(null).getBody().getData();
        assertThat(m.totalProducts()).isEqualTo(4L);
        assertThat(m.activeProducts()).isEqualTo(3L);
        assertThat(m.inactiveProducts()).isEqualTo(1L);
        assertThat(m.lowStockProducts()).isEqualTo(2L); // 3 ve 0 stoklu, ≤5
    }

    @Test
    void monthly_uses_provided_period() {
        when(orderRepo.searchByCompany(eq(7L), any(), any(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));
        when(productRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of()));

        MonthlyMetrics m = controller.monthly("2025-03").getBody().getData();
        assertThat(m.period()).isEqualTo("2025-03");
    }

    @Test
    void monthly_default_period_is_current_month() {
        when(orderRepo.searchByCompany(eq(7L), any(), any(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));
        when(productRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of()));

        MonthlyMetrics m = controller.monthly(null).getBody().getData();
        assertThat(m.period()).isEqualTo(YearMonth.now().toString());
    }
}
