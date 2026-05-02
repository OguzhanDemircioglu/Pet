package com.petshop.auth.service;

import com.petshop.auth.api.AuthFacade;
import com.petshop.tenant.service.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * JwtAuthenticationFilter'ın TenantContext.set davranışını sınar.
 * Tam @SpringBootTest yerine filter'ı direkt instantiate ediyoruz —
 * Testcontainers/Docker gerektirmez, hızlı çalışır.
 */
class JwtAuthFilterTenantTest {

    private com.petshop.auth.service.JwtAuthenticationFilter filter;
    private JwtTokenProvider tokenProvider;
    private AuthFacade authFacade;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider("test-secret-test-secret-test-secret-test!", 60_000L);
        authFacade = mock(AuthFacade.class);
        filter = new com.petshop.auth.service.JwtAuthenticationFilter(tokenProvider, authFacade);
    }

    @AfterEach
    void clear() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void valid_token_with_companyId_sets_tenant_context() throws Exception {
        when(authFacade.findTokenVersion(42L)).thenReturn(Optional.of(0));
        String token = tokenProvider.generateAccessToken(42L, "u@x.com", "ADMIN", 0, 99L, "PRO");

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(req.getHeader("Authorization")).thenReturn("Bearer " + token);

        // doFilterInternal çağrısını chain çağrısı sırasında TenantContext'in set olduğunu yakalamak için
        final Long[] captured = {null};
        final String[] capturedPlan = {null};
        FilterChain capturingChain = (rq, rp) -> {
            captured[0] = TenantContext.get();
            capturedPlan[0] = TenantContext.getPlan();
        };

        invokeDoFilter(filter, req, res, capturingChain);

        assertThat(captured[0]).isEqualTo(99L);
        assertThat(capturedPlan[0]).isEqualTo("PRO");
        // finally bloğu sonrasında context temizlendi mi
        assertThat(TenantContext.get()).isNull();

        // SecurityContext de doldu mu
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(42L);
        assertThat(auth.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_ADMIN");
    }

    @Test
    void legacy_token_without_companyId_does_not_set_tenant() throws Exception {
        when(authFacade.findTokenVersion(1L)).thenReturn(Optional.of(0));
        String legacyToken = tokenProvider.generateAccessToken(1L, "u@x.com", "CUSTOMER", 0); // overload without companyId

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        when(req.getHeader("Authorization")).thenReturn("Bearer " + legacyToken);

        final Long[] captured = {null};
        FilterChain capturingChain = (rq, rp) -> { captured[0] = TenantContext.get(); };

        invokeDoFilter(filter, req, res, capturingChain);

        assertThat(captured[0]).isNull(); // companyId yoksa tenant set edilmez
    }

    @Test
    void token_version_mismatch_blocks_authentication() throws Exception {
        when(authFacade.findTokenVersion(7L)).thenReturn(Optional.of(5)); // current=5
        String oldToken = tokenProvider.generateAccessToken(7L, "u@x.com", "ADMIN", 1, 1L, "FREE"); // tv=1

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        when(req.getHeader("Authorization")).thenReturn("Bearer " + oldToken);

        invokeDoFilter(filter, req, res, mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(TenantContext.get()).isNull();
    }

    @Test
    void no_authorization_header_passes_through_without_auth() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        when(req.getHeader("Authorization")).thenReturn(null);

        invokeDoFilter(filter, req, res, mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(TenantContext.get()).isNull();
    }

    private static void invokeDoFilter(com.petshop.auth.service.JwtAuthenticationFilter f,
                                       HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws Exception {
        var m = com.petshop.auth.service.JwtAuthenticationFilter.class
                .getDeclaredMethod("doFilterInternal", HttpServletRequest.class, HttpServletResponse.class, FilterChain.class);
        m.setAccessible(true);
        m.invoke(f, req, res, chain);
    }
}
