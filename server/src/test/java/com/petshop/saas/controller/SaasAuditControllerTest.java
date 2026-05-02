package com.petshop.saas.controller;

import com.petshop.audit.entity.AuditLog;
import com.petshop.audit.repository.AuditLogRepository;
import com.petshop.tenant.exception.PlanFeatureLockedException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SaasAuditControllerTest {

    private AuditLogRepository auditRepo;
    private PlanLimitService planLimit;
    private SaasAuditController controller;

    @BeforeEach
    void init() {
        auditRepo = mock(AuditLogRepository.class);
        planLimit = mock(PlanLimitService.class);
        controller = new SaasAuditController(auditRepo, planLimit);
        TenantContext.set(7L, "PRO");
        when(auditRepo.search(anyLong(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), Pageable.unpaged(), 0));
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void list_requires_pro_plan() {
        doThrow(new PlanFeatureLockedException("PRO")).when(planLimit).assertFeatureSalesHistory(7L);
        assertThatThrownBy(() -> controller.list(0, 50, null, null, null, null, null))
                .isInstanceOf(PlanFeatureLockedException.class);
    }

    @Test
    void list_passes_null_filters_when_blank() {
        controller.list(0, 50, "", "  ", null, null, null);
        verify(auditRepo).search(eq(7L), isNull(), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void list_passes_filters_when_provided() {
        controller.list(0, 50, "product", "STOCK_ADJUST", 99L,
                LocalDate.parse("2026-01-01"), LocalDate.parse("2026-12-31"));

        ArgumentCaptor<LocalDateTime> fromCap = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> toCap = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(auditRepo).search(eq(7L), eq("product"), eq("STOCK_ADJUST"),
                fromCap.capture(), toCap.capture(), eq(99L), any());
        assertThat(fromCap.getValue().toLocalDate()).isEqualTo(LocalDate.parse("2026-01-01"));
        // to inclusive: bitiş gününün sonu = ertesi günün başlangıcı
        assertThat(toCap.getValue().toLocalDate()).isEqualTo(LocalDate.parse("2027-01-01"));
    }

    @Test
    void list_returns_dto_mapping() {
        AuditLog log = AuditLog.builder()
                .id(1L).companyId(7L).userId(99L)
                .action("PRODUCT_CREATE").resourceType("product").resourceId(50L)
                .details("name=Mama").ip("1.1.1.1").build();
        when(auditRepo.search(anyLong(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(log), Pageable.unpaged(), 1));

        var result = controller.list(0, 50, null, null, null, null, null).getBody().getData();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).action()).isEqualTo("PRODUCT_CREATE");
    }

    @Test
    void list_caps_size_at_200() {
        controller.list(0, 1000, null, null, null, null, null);
        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(auditRepo).search(anyLong(), any(), any(), any(), any(), any(), cap.capture());
        assertThat(cap.getValue().getPageSize()).isEqualTo(200);
    }
}
