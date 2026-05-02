package com.petshop.saas.service;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.saas.dto.CreateProductRequest;
import com.petshop.saas.dto.UpdateProductRequest;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SaasProductServiceTest {

    private ProductRepository repo;
    private PlanLimitService planLimit;
    private SaasProductService service;

    @BeforeEach
    void init() {
        repo = mock(ProductRepository.class);
        planLimit = mock(PlanLimitService.class);
        service = new SaasProductService(repo, planLimit, mock(com.petshop.audit.service.AuditLogger.class));
        TenantContext.set(7L, "FREE");
        when(repo.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        when(repo.findBySku(any())).thenReturn(Optional.empty());
    }

    @AfterEach
    void clear() {
        TenantContext.clear();
    }

    @Test
    void create_calls_plan_limit_and_sets_companyId() {
        service.create(new CreateProductRequest("Mama 5kg", "SKU-1", new BigDecimal("199.99"), 50));
        verify(planLimit).assertCanAddProduct(7L);
        verify(repo).save(argThat(p -> p.getCompanyId().equals(7L) && p.getStockQuantity() == 50));
    }

    @Test
    void getById_cross_tenant_throws() {
        when(repo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(CrossTenantAccessException.class);
    }

    @Test
    void update_only_works_within_tenant() {
        when(repo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L,
                new UpdateProductRequest("X", BigDecimal.ONE, 1, true)))
                .isInstanceOf(CrossTenantAccessException.class);
    }

    @Test
    void create_without_tenant_context_fails() {
        TenantContext.clear();
        assertThatThrownBy(() -> service.create(
                new CreateProductRequest("X", "SKU-X", BigDecimal.ONE, 1)))
                .isInstanceOf(IllegalStateException.class);
    }
}
