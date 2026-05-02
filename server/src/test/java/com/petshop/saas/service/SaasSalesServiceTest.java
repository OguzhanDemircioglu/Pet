package com.petshop.saas.service;

import com.petshop.audit.service.AuditLogger;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.exception.BusinessException;
import com.petshop.order.entity.Order;
import com.petshop.order.entity.OrderItem;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.CreateSaleRequest;
import com.petshop.saas.dto.SaleDto;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.exception.PlanFeatureLockedException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SaasSalesServiceTest {

    private OrderRepository orderRepo;
    private ProductRepository productRepo;
    private PlanLimitService planLimit;
    private AuditLogger audit;
    private SaasSalesService service;

    @BeforeEach
    void init() {
        orderRepo = mock(OrderRepository.class);
        productRepo = mock(ProductRepository.class);
        planLimit = mock(PlanLimitService.class);
        audit = mock(AuditLogger.class);
        service = new SaasSalesService(orderRepo, productRepo, planLimit, audit);
        TenantContext.set(7L, "PRO");
        when(orderRepo.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            if (o.getId() == null) o.setId(1L);
            return o;
        });
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private Product product(Long id, String name, BigDecimal price, int stock) {
        return Product.builder().id(id).companyId(7L).name(name).sku("SKU-" + id)
                .basePrice(price).stockQuantity(stock).reservedQuantity(0)
                .isActive(true).isFeatured(false).build();
    }

    @Test
    void create_sale_decrements_stock_and_calculates_total() {
        Product p1 = product(10L, "Mama", new BigDecimal("100"), 50);
        Product p2 = product(11L, "Tasma", new BigDecimal("50"), 30);
        when(productRepo.findByIdAndCompanyId(10L, 7L)).thenReturn(Optional.of(p1));
        when(productRepo.findByIdAndCompanyId(11L, 7L)).thenReturn(Optional.of(p2));

        CreateSaleRequest req = new CreateSaleRequest("Ali", null, List.of(
                new CreateSaleRequest.Item(10L, 2),  // 200
                new CreateSaleRequest.Item(11L, 3)   // 150
        ));
        SaleDto sale = service.create(req);

        assertThat(sale.total()).isEqualByComparingTo(new BigDecimal("350"));
        assertThat(p1.getStockQuantity()).isEqualTo(48); // 50-2
        assertThat(p2.getStockQuantity()).isEqualTo(27); // 30-3
        assertThat(sale.customerName()).isEqualTo("Ali");
        assertThat(sale.items()).hasSize(2);
        verify(audit).log(eq("SALE_CREATE"), eq("order"), any(), anyString());
    }

    @Test
    void insufficient_stock_throws_business() {
        Product p = product(10L, "Az", new BigDecimal("10"), 1);
        when(productRepo.findByIdAndCompanyId(10L, 7L)).thenReturn(Optional.of(p));

        CreateSaleRequest req = new CreateSaleRequest(null, null, List.of(
                new CreateSaleRequest.Item(10L, 5)
        ));
        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Stok yetersiz");
    }

    @Test
    void cross_tenant_product_in_sale_throws() {
        when(productRepo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.empty());
        CreateSaleRequest req = new CreateSaleRequest(null, null, List.of(
                new CreateSaleRequest.Item(99L, 1)
        ));
        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(CrossTenantAccessException.class);
    }

    @Test
    void list_requires_sales_history_feature_pro() {
        doThrow(new PlanFeatureLockedException("PRO")).when(planLimit).assertFeatureSalesHistory(7L);
        assertThatThrownBy(() -> service.list(0, 10))
                .isInstanceOf(PlanFeatureLockedException.class);
    }

    @Test
    void search_passes_null_filters_when_blank() {
        when(orderRepo.searchByCompany(eq(7L), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));

        service.search(0, 20, null, null, "  ");

        ArgumentCaptor<String> qCap = ArgumentCaptor.forClass(String.class);
        verify(orderRepo).searchByCompany(eq(7L), isNull(), isNull(), qCap.capture(), any());
        // boş/whitespace string null'a normalize edilir
        assertThat(qCap.getValue()).isNull();
    }

    @Test
    void recent_returns_top_10_for_tenant() {
        Order o = Order.builder().id(1L).companyId(7L).orderNumber("X")
                .total(BigDecimal.TEN).subtotal(BigDecimal.TEN).discountAmount(BigDecimal.ZERO)
                .status(Order.OrderStatus.PAID).paymentMethod(Order.PaymentMethod.COD)
                .items(new java.util.ArrayList<>()).build();
        when(orderRepo.findTop10ByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(o));

        var result = service.recent();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).orderNumber()).isEqualTo("X");
    }

    @Test
    void getById_cross_tenant_throws() {
        when(orderRepo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(CrossTenantAccessException.class);
    }

    private static <T> T eq(T t) { return org.mockito.ArgumentMatchers.eq(t); }
    private static <T> T isNull() { return org.mockito.ArgumentMatchers.isNull(); }
    private static String anyString() { return org.mockito.ArgumentMatchers.anyString(); }
}
