package com.petshop.auth.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        // 32 bytes minimum HS256 secret
        String secret = "test-secret-test-secret-test-secret-test!";
        provider = new JwtTokenProvider(secret, 60_000L);
    }

    @Test
    void token_contains_companyId_and_plan() {
        String token = provider.generateAccessToken(1L, "a@b.com", "ADMIN", 0, 99L, "PRO");
        assertThat(token).isNotBlank();
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getCompanyIdFromToken(token)).isEqualTo(99L);
        assertThat(provider.getPlanFromToken(token)).isEqualTo("PRO");
        Claims c = provider.parseToken(token);
        assertThat(c.get("role", String.class)).isEqualTo("ADMIN");
        assertThat(c.get("tv", Integer.class)).isZero();
    }

    @Test
    void legacy_token_without_companyId_still_parses() {
        String token = provider.generateAccessToken(1L, "a@b.com", "CUSTOMER", 0);
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getCompanyIdFromToken(token)).isNull();
        assertThat(provider.getPlanFromToken(token)).isNull();
    }

    @Test
    void invalid_token_returns_false() {
        assertThat(provider.validateToken("garbage")).isFalse();
    }
}
