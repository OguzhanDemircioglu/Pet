package com.petshop.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        RateLimitFilter.clearForTesting();
        filter = new RateLimitFilter();
    }

    private MockHttpServletRequest req(String path, String ip) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setMethod("POST");
        r.setRequestURI(path);
        r.setRemoteAddr(ip);
        return r;
    }

    @Test
    void register_company_blocks_after_5_attempts_from_same_ip() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req("/auth/register-company", "1.1.1.1"), res, chain);
            assertThat(res.getStatus()).as("attempt %d", i + 1).isEqualTo(200);
        }
        // 6. istek 429 olmalı
        MockHttpServletResponse res6 = new MockHttpServletResponse();
        filter.doFilter(req("/auth/register-company", "1.1.1.1"), res6, chain);
        assertThat(res6.getStatus()).isEqualTo(429);
        assertThat(res6.getHeader("Retry-After")).isNotNull();
        assertThat(res6.getContentAsString()).contains("RATE_LIMIT");
        // chain 5 kez çağrılmış olmalı (6.'da blok)
        verify(chain, times(5)).doFilter(any(), any());
    }

    @Test
    void different_ips_have_separate_buckets() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        for (int i = 0; i < 5; i++) {
            filter.doFilter(req("/auth/register-company", "10.0.0.1"), new MockHttpServletResponse(), chain);
        }
        // Farklı IP — kendi bucket'ı, 5 istek hâlâ açık
        MockHttpServletResponse other = new MockHttpServletResponse();
        filter.doFilter(req("/auth/register-company", "10.0.0.2"), other, chain);
        assertThat(other.getStatus()).isEqualTo(200);
    }

    @Test
    void login_has_separate_higher_limit_than_register_company() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        // 6 register-company → 6.'sı bloklanır
        for (int i = 0; i < 5; i++) {
            filter.doFilter(req("/auth/register-company", "5.5.5.5"), new MockHttpServletResponse(), chain);
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(req("/auth/register-company", "5.5.5.5"), blocked, chain);
        assertThat(blocked.getStatus()).isEqualTo(429);

        // Aynı IP'den /auth/login isteği serbest (farklı bucket)
        MockHttpServletResponse loginRes = new MockHttpServletResponse();
        filter.doFilter(req("/auth/login", "5.5.5.5"), loginRes, chain);
        assertThat(loginRes.getStatus()).isEqualTo(200);
    }

    @Test
    void non_rate_limited_paths_pass_through() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setMethod("POST");
        r.setRequestURI("/admin/saas/products");
        r.setRemoteAddr("8.8.8.8");
        for (int i = 0; i < 100; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(r, res, chain);
            assertThat(res.getStatus()).isEqualTo(200);
        }
        verify(chain, times(100)).doFilter(any(), any());
    }

    @Test
    void get_requests_are_not_rate_limited() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setMethod("GET");
        r.setRequestURI("/auth/login"); // GET olduğu için filter atlanır
        r.setRemoteAddr("9.9.9.9");
        for (int i = 0; i < 50; i++) {
            filter.doFilter(r, new MockHttpServletResponse(), chain);
        }
        verify(chain, times(50)).doFilter(any(), any());
    }

    @Test
    void x_forwarded_for_is_used_as_client_ip() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        // İlk 5 istek: real client = 7.7.7.7 (XFF), proxy = 192.168.1.1
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest r = req("/auth/register-company", "192.168.1.1");
            r.addHeader("X-Forwarded-For", "7.7.7.7, 192.168.1.1");
            filter.doFilter(r, new MockHttpServletResponse(), chain);
        }
        // 6. istek aynı XFF → blok
        MockHttpServletRequest r6 = req("/auth/register-company", "192.168.1.1");
        r6.addHeader("X-Forwarded-For", "7.7.7.7, 192.168.1.1");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(r6, res, chain);
        assertThat(res.getStatus()).isEqualTo(429);

        // Farklı XFF → ayrı bucket, blok yok
        MockHttpServletRequest r7 = req("/auth/register-company", "192.168.1.1");
        r7.addHeader("X-Forwarded-For", "8.8.8.8, 192.168.1.1");
        MockHttpServletResponse res7 = new MockHttpServletResponse();
        filter.doFilter(r7, res7, chain);
        assertThat(res7.getStatus()).isEqualTo(200);
    }

    private static <T> T any() {
        return org.mockito.ArgumentMatchers.any();
    }
}
