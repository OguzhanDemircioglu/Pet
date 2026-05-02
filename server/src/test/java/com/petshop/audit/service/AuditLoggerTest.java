package com.petshop.audit.service;

import com.petshop.audit.entity.AuditLog;
import com.petshop.audit.repository.AuditLogRepository;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuditLoggerTest {

    private AuditLogRepository repo;
    private AuditLogger logger;

    @BeforeEach
    void setUp() {
        repo = mock(AuditLogRepository.class);
        logger = new AuditLogger(repo);
        when(repo.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void cleanup() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void log_persists_with_company_user_and_ip() {
        TenantContext.set(42L, "PRO");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(7L, null, java.util.List.of()));
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("3.3.3.3");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));

        // Sync persist (test'te @Async devre dışı, persist() doğrudan çalışır)
        logger.persist(42L, 7L, "PRODUCT_CREATE", "product", 99L, "name=Mama", "3.3.3.3");

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        AuditLog saved = cap.getValue();
        assertThat(saved.getCompanyId()).isEqualTo(42L);
        assertThat(saved.getUserId()).isEqualTo(7L);
        assertThat(saved.getAction()).isEqualTo("PRODUCT_CREATE");
        assertThat(saved.getResourceType()).isEqualTo("product");
        assertThat(saved.getResourceId()).isEqualTo(99L);
        assertThat(saved.getDetails()).isEqualTo("name=Mama");
        assertThat(saved.getIp()).isEqualTo("3.3.3.3");
    }

    @Test
    void log_skipped_when_tenant_context_missing() {
        // TenantContext set edilmedi → log() erken return
        logger.log("PRODUCT_CREATE", "product", 1L, "no-op");
        verifyNoInteractions(repo);
    }

    @Test
    void log_extracts_xff_first_ip() {
        TenantContext.set(1L, "FREE");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("192.168.1.1");
        req.addHeader("X-Forwarded-For", "203.0.113.5, 192.168.1.1, 10.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));

        logger.log("TEST", "x", 1L, null);

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().getIp()).isEqualTo("203.0.113.5");
    }

    @Test
    void details_truncated_to_4000_chars() {
        TenantContext.set(1L, "FREE");
        String huge = "x".repeat(5000);
        logger.persist(1L, 1L, "TEST", "x", 1L, huge, "1.1.1.1");
        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().getDetails()).hasSize(4000);
    }
}
