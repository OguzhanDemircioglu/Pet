package com.petshop.saas.controller;

import com.petshop.audit.service.AuditLogger;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.order.repository.OrderRepository;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SaasExportControllerTest {

    private ProductRepository productRepo;
    private OrderRepository orderRepo;
    private CompanyService companyService;
    private AuditLogger audit;
    private SaasExportController controller;

    @BeforeEach
    void init() {
        productRepo = mock(ProductRepository.class);
        orderRepo = mock(OrderRepository.class);
        companyService = mock(CompanyService.class);
        audit = mock(AuditLogger.class);
        controller = new SaasExportController(companyService, productRepo, orderRepo, audit);
        TenantContext.set(7L, "PRO");
        when(companyService.getById(7L)).thenReturn(Company.builder()
                .id(7L).slug("test-shop").name("Test").plan(Plan.PRO).build());
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private Product product(String name, String sku, BigDecimal price, int stock) {
        return Product.builder().id(1L).companyId(7L).name(name).sku(sku)
                .basePrice(price).stockQuantity(stock).reservedQuantity(0)
                .isActive(true).isFeatured(false).build();
    }

    @Test
    void export_all_returns_json_with_company_products_orders() {
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(
                product("X", "X-1", BigDecimal.TEN, 5)
        )));
        when(orderRepo.findByCompanyIdOrderByCreatedAtDesc(eq(7L), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));

        var resp = controller.exportAll();
        Map<String, Object> body = resp.getBody();
        assertThat(body).containsKeys("exportedAt", "company", "products", "orders");
        @SuppressWarnings("unchecked")
        Map<String, Object> companyMap = (Map<String, Object>) body.get("company");
        assertThat(companyMap).containsEntry("slug", "test-shop");
        assertThat(resp.getHeaders().get("Content-Disposition").get(0))
                .contains("attachment", "test-shop");
        verify(audit).log(eq("DATA_EXPORT"), eq("company"), eq(7L), anyString());
    }

    @Test
    void export_csv_includes_utf8_bom_and_header() {
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(
                product("Mama", "M-1", new BigDecimal("99.50"), 42)
        )));

        var resp = controller.exportProductsCsv();
        String csv = resp.getBody();
        assertThat(csv).startsWith("﻿"); // UTF-8 BOM
        assertThat(csv).contains("name,sku,price,stock");
        assertThat(csv).contains("Mama,M-1,99.50,42");
        assertThat(resp.getHeaders().get("Content-Disposition").get(0))
                .contains(".csv");
    }

    @Test
    void csv_escapes_special_characters() {
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(
                product("Mama, Premium", "PRM-1", BigDecimal.ONE, 10),
                product("Has \"quote\"", "Q-1", BigDecimal.ONE, 5)
        )));

        var csv = controller.exportProductsCsv().getBody();
        // Virgül içeren isim çift tırnaklı
        assertThat(csv).contains("\"Mama, Premium\"");
        // Çift tırnak escape edilir (")
        assertThat(csv).contains("\"Has \"\"quote\"\"\"");
    }

    @Test
    void csv_audit_logs_format() {
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(new PageImpl<>(List.of()));
        controller.exportProductsCsv();
        verify(audit).log(eq("DATA_EXPORT"), eq("product"), eq(7L), contains("format=csv"));
    }

    private static String anyString() { return org.mockito.ArgumentMatchers.anyString(); }
    private static String contains(String s) { return org.mockito.ArgumentMatchers.contains(s); }
}
