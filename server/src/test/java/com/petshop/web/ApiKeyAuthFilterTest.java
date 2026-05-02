package com.petshop.web;

import com.petshop.saas.service.SaasApiKeyService;
import com.petshop.tenant.entity.ApiKey;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.ApiKeyRepository;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.TenantContext;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ApiKeyAuthFilterTest {

    private ApiKeyRepository apiKeyRepo;
    private CompanyRepository companyRepo;
    private ApiKeyAuthFilter.ApiKeyTouchService touchService;
    private ApiKeyAuthFilter filter;

    @BeforeEach
    void init() {
        apiKeyRepo = mock(ApiKeyRepository.class);
        companyRepo = mock(CompanyRepository.class);
        touchService = mock(ApiKeyAuthFilter.ApiKeyTouchService.class);
        filter = new ApiKeyAuthFilter(apiKeyRepo, companyRepo, touchService);
    }

    @AfterEach
    void clear() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest req(String headerValue) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setMethod("GET");
        r.setRequestURI("/admin/saas/products");
        if (headerValue != null) r.addHeader("X-API-Key", headerValue);
        return r;
    }

    private ApiKey activeKey() {
        return ApiKey.builder().id(99L).companyId(7L).name("test")
                .prefix("pt_live_").keyHash("hash").lastFour("abcd").build();
    }

    private Company activeCompany() {
        return Company.builder().id(7L).slug("c7").name("Co7").plan(Plan.PRO).isActive(true).build();
    }

    @Test
    void no_header_passes_through_silently() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req(null), res, chain);
        assertThat(res.getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(TenantContext.get()).isNull();
        verify(chain).doFilter(any(), any());
    }

    @Test
    void wrong_prefix_passes_through_no_auth() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req("Bearer xyz"), res, chain);
        // pt_live_ ile başlamıyor → filter ignore eder, JWT filter'a düşer
        verify(chain).doFilter(any(), any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void valid_key_sets_tenant_context_and_security() throws Exception {
        String plaintext = "pt_live_abcdef0123456789";
        String hash = SaasApiKeyService.sha256(plaintext);
        ApiKey key = activeKey();
        key.setKeyHash(hash);
        when(apiKeyRepo.findByKeyHash(hash)).thenReturn(Optional.of(key));
        when(companyRepo.findById(7L)).thenReturn(Optional.of(activeCompany()));

        final Long[] cidCaptured = { null };
        FilterChain chain = (rq, rp) -> { cidCaptured[0] = TenantContext.get(); };

        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req(plaintext), res, chain);

        assertThat(cidCaptured[0]).isEqualTo(7L);
        assertThat(TenantContext.get()).isNull(); // finally clear
        verify(touchService).touchAsync(99L);
    }

    @Test
    void revoked_key_returns_401() throws Exception {
        String plaintext = "pt_live_revoked";
        String hash = SaasApiKeyService.sha256(plaintext);
        ApiKey key = activeKey();
        key.setKeyHash(hash);
        key.setRevokedAt(LocalDateTime.now().minusDays(1));
        when(apiKeyRepo.findByKeyHash(hash)).thenReturn(Optional.of(key));

        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req(plaintext), res, chain);

        assertThat(res.getStatus()).isEqualTo(401);
        assertThat(res.getContentAsString()).contains("INVALID_API_KEY", "iptal");
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void unknown_key_returns_401() throws Exception {
        String plaintext = "pt_live_doesnotexist";
        when(apiKeyRepo.findByKeyHash(SaasApiKeyService.sha256(plaintext))).thenReturn(Optional.empty());

        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req(plaintext), res, chain);

        assertThat(res.getStatus()).isEqualTo(401);
        assertThat(res.getContentAsString()).contains("INVALID_API_KEY", "Geçersiz");
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void inactive_company_returns_401() throws Exception {
        String plaintext = "pt_live_inactiveco";
        String hash = SaasApiKeyService.sha256(plaintext);
        ApiKey key = activeKey();
        key.setKeyHash(hash);
        Company inactive = activeCompany();
        inactive.setIsActive(false);

        when(apiKeyRepo.findByKeyHash(hash)).thenReturn(Optional.of(key));
        when(companyRepo.findById(7L)).thenReturn(Optional.of(inactive));

        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req(plaintext), res, chain);

        assertThat(res.getStatus()).isEqualTo(401);
        verify(chain, never()).doFilter(any(), any());
    }
}
