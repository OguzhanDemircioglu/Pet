package com.petshop.saas.controller;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PublicShopControllerTest {

    private CompanyRepository companyRepo;
    private ProductRepository productRepo;
    private PublicShopController controller;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        productRepo = mock(ProductRepository.class);
        controller = new PublicShopController(companyRepo, productRepo);
    }

    private Company company(Plan plan, boolean active) {
        return Company.builder().id(7L).slug("test-shop").name("Test Shop")
                .plan(plan).isActive(active).build();
    }

    private Product product(boolean active) {
        return Product.builder().id(1L).companyId(7L).name("Mama").sku("M-1")
                .basePrice(BigDecimal.TEN).stockQuantity(10).reservedQuantity(0)
                .isActive(active).isFeatured(false).build();
    }

    @Test
    void pro_plus_active_company_returns_shop() {
        when(companyRepo.findBySlug("test-shop")).thenReturn(Optional.of(company(Plan.PRO_PLUS, true)));
        when(productRepo.findByCompanyId(eq(7L), any())).thenReturn(
                new PageImpl<>(List.of(product(true), product(false)), Pageable.unpaged(), 2));

        var shop = controller.get("test-shop").getBody().getData();
        assertThat(shop.name()).isEqualTo("Test Shop");
        // Sadece active ürünler döner
        assertThat(shop.products()).hasSize(1);
    }

    @Test
    void pro_plan_company_returns_404() {
        when(companyRepo.findBySlug("test-shop")).thenReturn(Optional.of(company(Plan.PRO, true)));
        assertThatThrownBy(() -> controller.get("test-shop"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void free_plan_company_returns_404() {
        when(companyRepo.findBySlug("test-shop")).thenReturn(Optional.of(company(Plan.FREE, true)));
        assertThatThrownBy(() -> controller.get("test-shop"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void inactive_company_returns_404() {
        when(companyRepo.findBySlug("test-shop")).thenReturn(Optional.of(company(Plan.PRO_PLUS, false)));
        assertThatThrownBy(() -> controller.get("test-shop"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unknown_slug_returns_404() {
        when(companyRepo.findBySlug("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.get("ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
