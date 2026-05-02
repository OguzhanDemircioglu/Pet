package com.petshop.saas.controller;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.order.entity.Order;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.DashboardStats;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SaasDashboardControllerTest {

    private ProductRepository productRepo;
    private OrderRepository orderRepo;
    private PlanLimitService planLimit;
    private SaasDashboardController controller;

    @BeforeEach
    void init() {
        productRepo = mock(ProductRepository.class);
        orderRepo = mock(OrderRepository.class);
        planLimit = mock(PlanLimitService.class);
        controller = new SaasDashboardController(productRepo, orderRepo, planLimit);
        TenantContext.set(7L, "FREE");
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void empty_dashboard_returns_zeros() {
        when(planLimit.getPlan(7L)).thenReturn(Plan.FREE);
        when(productRepo.countByCompanyId(7L)).thenReturn(0L);
        when(orderRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findLowStockByCompany(eq(7L), eq(5), any())).thenReturn(List.of());
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        DashboardStats s = controller.stats().getBody().getData();
        assertThat(s.productCount()).isZero();
        assertThat(s.salesCount()).isZero();
        assertThat(s.lowStock()).isEmpty();
        assertThat(s.recentSales()).isEmpty();
    }

    @Test
    void free_plan_returns_20_product_limit() {
        when(planLimit.getPlan(7L)).thenReturn(Plan.FREE);
        when(productRepo.countByCompanyId(7L)).thenReturn(15L);
        when(orderRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findLowStockByCompany(eq(7L), eq(5), any())).thenReturn(List.of());
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        DashboardStats s = controller.stats().getBody().getData();
        assertThat(s.productLimit()).isEqualTo(20);
        assertThat(s.plan()).isEqualTo("FREE");
    }

    @Test
    void pro_plan_returns_unlimited() {
        when(planLimit.getPlan(7L)).thenReturn(Plan.PRO);
        when(productRepo.countByCompanyId(7L)).thenReturn(150L);
        when(orderRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findLowStockByCompany(eq(7L), eq(5), any())).thenReturn(List.of());
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        DashboardStats s = controller.stats().getBody().getData();
        assertThat(s.productLimit()).isEqualTo(-1); // sınırsız
        assertThat(s.plan()).isEqualTo("PRO");
    }

    @Test
    void low_stock_includes_threshold_5() {
        Product p = Product.builder().id(1L).companyId(7L).name("X").sku("X")
                .basePrice(BigDecimal.ONE).stockQuantity(3).reservedQuantity(0)
                .isActive(true).isFeatured(false).build();
        when(planLimit.getPlan(7L)).thenReturn(Plan.PRO);
        when(productRepo.countByCompanyId(7L)).thenReturn(1L);
        when(orderRepo.countByCompanyId(7L)).thenReturn(0L);
        when(productRepo.findLowStockByCompany(eq(7L), eq(5), any())).thenReturn(List.of(p));
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        DashboardStats s = controller.stats().getBody().getData();
        assertThat(s.lowStock()).hasSize(1);
        assertThat(s.lowStock().get(0).name()).isEqualTo("X");
    }

    @Test
    void recent_sales_max_10() {
        Order o = Order.builder().id(1L).companyId(7L).orderNumber("X")
                .total(BigDecimal.TEN).subtotal(BigDecimal.TEN).discountAmount(BigDecimal.ZERO)
                .status(Order.OrderStatus.PAID).paymentMethod(Order.PaymentMethod.COD)
                .items(new java.util.ArrayList<>()).build();
        when(planLimit.getPlan(7L)).thenReturn(Plan.PRO);
        when(productRepo.countByCompanyId(7L)).thenReturn(0L);
        when(orderRepo.countByCompanyId(7L)).thenReturn(1L);
        when(productRepo.findLowStockByCompany(eq(7L), eq(5), any())).thenReturn(List.of());
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(o));

        DashboardStats s = controller.stats().getBody().getData();
        assertThat(s.recentSales()).hasSize(1);
    }
}
