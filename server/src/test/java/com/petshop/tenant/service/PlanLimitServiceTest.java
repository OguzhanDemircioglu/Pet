package com.petshop.tenant.service;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.exception.PlanFeatureLockedException;
import com.petshop.tenant.exception.PlanLimitExceededException;
import com.petshop.tenant.repository.CompanyRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PlanLimitServiceTest {

    private CompanyRepository companyRepo;
    private ProductRepository productRepo;
    private EntityManager em;
    private PlanLimitService service;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        productRepo = mock(ProductRepository.class);
        em = mock(EntityManager.class);
        Query q = mock(Query.class);
        when(em.createNativeQuery(anyString())).thenReturn(q);
        when(q.setParameter(anyString(), any())).thenReturn(q);
        when(q.getSingleResult()).thenReturn(0);
        service = new PlanLimitService(companyRepo, productRepo, em);
    }

    @Test
    void free_at_19_products_allowed() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.FREE));
        when(productRepo.countByCompanyId(1L)).thenReturn(19L);
        assertThatCode(() -> service.assertCanAddProduct(1L)).doesNotThrowAnyException();
    }

    @Test
    void free_at_20_products_throws() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.FREE));
        when(productRepo.countByCompanyId(1L)).thenReturn(20L);
        assertThatThrownBy(() -> service.assertCanAddProduct(1L))
                .isInstanceOf(PlanLimitExceededException.class)
                .hasMessageContaining("FREE");
    }

    @Test
    void pro_unlimited_products() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.PRO));
        when(productRepo.countByCompanyId(1L)).thenReturn(10_000L);
        assertThatCode(() -> service.assertCanAddProduct(1L)).doesNotThrowAnyException();
    }

    @Test
    void free_blocks_sales_history() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.FREE));
        assertThatThrownBy(() -> service.assertFeatureSalesHistory(1L))
                .isInstanceOf(PlanFeatureLockedException.class);
    }

    @Test
    void pro_allows_sales_history() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.PRO));
        assertThatCode(() -> service.assertFeatureSalesHistory(1L)).doesNotThrowAnyException();
    }

    @Test
    void only_pro_plus_allows_public_shop() {
        when(companyRepo.findPlanById(1L)).thenReturn(Optional.of(Plan.PRO));
        assertThatThrownBy(() -> service.assertFeaturePublicShop(1L))
                .isInstanceOf(PlanFeatureLockedException.class);
        when(companyRepo.findPlanById(2L)).thenReturn(Optional.of(Plan.PRO_PLUS));
        assertThatCode(() -> service.assertFeaturePublicShop(2L)).doesNotThrowAnyException();
    }
}
