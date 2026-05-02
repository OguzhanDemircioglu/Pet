package com.petshop.tenant.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.*;

class TenantContextTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void set_and_get_returns_value() {
        TenantContext.set(42L, "FREE");
        assertThat(TenantContext.get()).isEqualTo(42L);
        assertThat(TenantContext.getPlan()).isEqualTo("FREE");
    }

    @Test
    void clear_removes_value() {
        TenantContext.set(7L, "PRO");
        TenantContext.clear();
        assertThat(TenantContext.get()).isNull();
        assertThat(TenantContext.getPlan()).isNull();
    }

    @Test
    void require_throws_when_not_set() {
        assertThatThrownBy(TenantContext::require)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("companyId");
    }

    @Test
    void thread_isolation_no_leak_across_threads() throws Exception {
        TenantContext.set(1L, "FREE");
        AtomicReference<Long> otherThreadValue = new AtomicReference<>();
        CompletableFuture.runAsync(() -> otherThreadValue.set(TenantContext.get())).get();
        assertThat(otherThreadValue.get()).isNull();
        assertThat(TenantContext.get()).isEqualTo(1L);
    }
}
