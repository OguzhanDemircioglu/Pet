package com.petshop.saas.service;

import com.petshop.audit.service.AuditLogger;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.CreateApiKeyRequest;
import com.petshop.saas.dto.CreateApiKeyResponse;
import com.petshop.tenant.entity.ApiKey;
import com.petshop.tenant.repository.ApiKeyRepository;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SaasApiKeyServiceTest {

    private ApiKeyRepository repo;
    private SaasApiKeyService service;
    private AuditLogger audit;

    @BeforeEach
    void init() {
        repo = mock(ApiKeyRepository.class);
        audit = mock(AuditLogger.class);
        service = new SaasApiKeyService(repo, audit);
        TenantContext.set(7L, "PRO");
        when(repo.save(any(ApiKey.class))).thenAnswer(i -> {
            ApiKey k = i.getArgument(0);
            if (k.getId() == null) k.setId(1L);
            return k;
        });
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void create_returns_plaintext_only_once_and_persists_hash() {
        CreateApiKeyResponse res = service.create(new CreateApiKeyRequest("Zapier", "products:read,sales:write"));

        // Plaintext döner
        assertThat(res.plaintext()).startsWith("pt_live_").hasSizeGreaterThan(20);
        // ApiKeyDto plaintext içermez
        assertThat(res.key().lastFour()).hasSize(4);
        assertThat(res.key().prefix()).isEqualTo("pt_live_");

        ArgumentCaptor<ApiKey> cap = ArgumentCaptor.forClass(ApiKey.class);
        verify(repo).save(cap.capture());
        ApiKey saved = cap.getValue();
        assertThat(saved.getCompanyId()).isEqualTo(7L);
        assertThat(saved.getKeyHash()).hasSize(64); // SHA-256 hex
        // Hash plaintext'in SHA-256'sı
        assertThat(saved.getKeyHash()).isEqualTo(SaasApiKeyService.sha256(res.plaintext()));
        assertThat(saved.getName()).isEqualTo("Zapier");
        assertThat(saved.getScopes()).isEqualTo("products:read,sales:write");
        assertThat(saved.getRevokedAt()).isNull();
        verify(audit).log(eq("API_KEY_CREATE"), eq("api_key"), eq(1L), anyString());
    }

    @Test
    void create_generates_unique_keys() {
        var r1 = service.create(new CreateApiKeyRequest("k1", null));
        var r2 = service.create(new CreateApiKeyRequest("k2", null));
        assertThat(r1.plaintext()).isNotEqualTo(r2.plaintext());
    }

    @Test
    void revoke_sets_revoked_at_for_own_key() {
        ApiKey k = ApiKey.builder().id(99L).companyId(7L).name("X")
                .prefix("pt_live_").keyHash("h").lastFour("abcd").build();
        when(repo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.of(k));

        service.revoke(99L);

        assertThat(k.getRevokedAt()).isNotNull();
        verify(repo).save(k);
        verify(audit).log(eq("API_KEY_REVOKE"), eq("api_key"), eq(99L), anyString());
    }

    @Test
    void revoke_already_revoked_throws() {
        ApiKey k = ApiKey.builder().id(99L).companyId(7L).name("X")
                .prefix("pt_live_").keyHash("h").lastFour("abcd")
                .revokedAt(LocalDateTime.now().minusDays(1)).build();
        when(repo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.of(k));

        assertThatThrownBy(() -> service.revoke(99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("iptal edilmiş");
    }

    @Test
    void revoke_cross_tenant_throws() {
        when(repo.findByIdAndCompanyId(42L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.revoke(42L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void sha256_is_deterministic() {
        assertThat(SaasApiKeyService.sha256("abc")).isEqualTo(SaasApiKeyService.sha256("abc"));
        assertThat(SaasApiKeyService.sha256("a")).isNotEqualTo(SaasApiKeyService.sha256("b"));
    }
}
