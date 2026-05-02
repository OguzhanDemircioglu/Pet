package com.petshop.saas.controller;

import com.petshop.audit.service.AuditLogger;
import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.PlanUpgradeRequest;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SaasPlanControllerTest {

    private CompanyRepository companyRepo;
    private CompanyService companyService;
    private UserRepository userRepo;
    private AuthFacade authFacade;
    private AuditLogger audit;
    private SaasPlanController controller;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        companyService = mock(CompanyService.class);
        userRepo = mock(UserRepository.class);
        authFacade = mock(AuthFacade.class);
        audit = mock(AuditLogger.class);
        controller = new SaasPlanController(companyRepo, companyService, userRepo, authFacade, audit);
        TenantContext.set(7L, "FREE");
        when(companyRepo.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private Company company(Plan plan) {
        return Company.builder().id(7L).slug("c").name("Co").plan(plan).isActive(true).build();
    }

    @Test
    void info_returns_current_plan_with_available_options() {
        when(companyService.getById(7L)).thenReturn(company(Plan.PRO));
        var info = controller.info().getBody().getData();
        assertThat(info.plan()).isEqualTo(Plan.PRO);
        assertThat(info.availablePlans()).contains(Plan.FREE, Plan.PRO, Plan.PRO_PLUS);
        assertThat(info.companyId()).isEqualTo(7L);
    }

    @Test
    void change_to_same_plan_throws() {
        when(companyService.getById(7L)).thenReturn(company(Plan.PRO));
        assertThatThrownBy(() -> controller.change(1L, new PlanUpgradeRequest(Plan.PRO)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void change_updates_company_and_bumps_all_user_token_versions() {
        Company c = company(Plan.FREE);
        when(companyService.getById(7L)).thenReturn(c);
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(
                User.builder().id(1L).build(),
                User.builder().id(2L).build()
        ));

        controller.change(1L, new PlanUpgradeRequest(Plan.PRO));

        assertThat(c.getPlan()).isEqualTo(Plan.PRO);
        verify(authFacade).bumpTokenVersion(1L);
        verify(authFacade).bumpTokenVersion(2L);
        verify(audit).log(eq("PLAN_CHANGE"), eq("company"), eq(7L), anyString());
    }

    @Test
    void change_pro_to_pro_plus_works() {
        Company c = company(Plan.PRO);
        when(companyService.getById(7L)).thenReturn(c);
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        controller.change(1L, new PlanUpgradeRequest(Plan.PRO_PLUS));

        assertThat(c.getPlan()).isEqualTo(Plan.PRO_PLUS);
    }
}
