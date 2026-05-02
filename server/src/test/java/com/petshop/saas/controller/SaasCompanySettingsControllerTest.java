package com.petshop.saas.controller;

import com.petshop.audit.service.AuditLogger;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.UpdateCompanySettingsRequest;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SaasCompanySettingsControllerTest {

    private CompanyRepository companyRepo;
    private CompanyService companyService;
    private AuditLogger audit;
    private SaasCompanySettingsController controller;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        companyService = mock(CompanyService.class);
        audit = mock(AuditLogger.class);
        controller = new SaasCompanySettingsController(companyRepo, companyService, audit);
        TenantContext.set(7L, "PRO");
        when(companyRepo.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private Company company(Plan plan) {
        return Company.builder().id(7L).slug("c").name("Co").plan(plan).isActive(true)
                .lowStockThreshold(5).lowStockAlertEnabled(false)
                .dailySummaryEnabled(false).build();
    }

    @Test
    void get_returns_current_settings() {
        when(companyService.getById(7L)).thenReturn(company(Plan.PRO));
        var settings = controller.get().getBody().getData();
        assertThat(settings.plan()).isEqualTo("PRO");
        assertThat(settings.lowStockThreshold()).isEqualTo(5);
    }

    @Test
    void update_partial_changes_only_provided_fields() {
        Company c = company(Plan.PRO);
        when(companyService.getById(7L)).thenReturn(c);

        controller.update(new UpdateCompanySettingsRequest(
                null, 10, true, null, null
        ));

        assertThat(c.getName()).isEqualTo("Co");
        assertThat(c.getLowStockThreshold()).isEqualTo(10);
        assertThat(c.getLowStockAlertEnabled()).isTrue();
        assertThat(c.getDailySummaryEnabled()).isFalse(); // değişmedi
    }

    @Test
    void update_low_stock_alert_on_FREE_throws() {
        when(companyService.getById(7L)).thenReturn(company(Plan.FREE));
        assertThatThrownBy(() -> controller.update(
                new UpdateCompanySettingsRequest(null, null, true, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PRO");
    }

    @Test
    void update_daily_summary_on_FREE_throws() {
        when(companyService.getById(7L)).thenReturn(company(Plan.FREE));
        assertThatThrownBy(() -> controller.update(
                new UpdateCompanySettingsRequest(null, null, null, true, null)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void update_FREE_with_alerts_disabled_succeeds() {
        Company c = company(Plan.FREE);
        when(companyService.getById(7L)).thenReturn(c);

        // FREE'de threshold + email değiştirme OK (toggle false bırakıldıkça)
        controller.update(new UpdateCompanySettingsRequest(
                "Yeni İsim", 20, false, false, "ops@x.com"
        ));

        assertThat(c.getName()).isEqualTo("Yeni İsim");
        assertThat(c.getLowStockThreshold()).isEqualTo(20);
        assertThat(c.getNotificationEmail()).isEqualTo("ops@x.com");
    }

    @Test
    void update_blank_email_clears_field() {
        Company c = company(Plan.PRO);
        c.setNotificationEmail("old@x.com");
        when(companyService.getById(7L)).thenReturn(c);

        controller.update(new UpdateCompanySettingsRequest(null, null, null, null, ""));

        assertThat(c.getNotificationEmail()).isNull();
    }

    @Test
    void update_logs_audit() {
        when(companyService.getById(7L)).thenReturn(company(Plan.PRO));
        controller.update(new UpdateCompanySettingsRequest(null, 15, null, null, null));
        verify(audit).log(eq("COMPANY_SETTINGS_UPDATE"), eq("company"), eq(7L), anyString());
    }
}
