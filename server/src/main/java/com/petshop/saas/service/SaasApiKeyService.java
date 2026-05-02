package com.petshop.saas.service;

import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.ApiKeyDto;
import com.petshop.saas.dto.CreateApiKeyRequest;
import com.petshop.saas.dto.CreateApiKeyResponse;
import com.petshop.tenant.entity.ApiKey;
import com.petshop.tenant.repository.ApiKeyRepository;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaasApiKeyService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PREFIX = "pt_live_";

    private final ApiKeyRepository repo;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @Transactional(readOnly = true)
    public List<ApiKeyDto> list() {
        Long cid = TenantContext.require();
        return repo.findByCompanyIdOrderByCreatedAtDesc(cid).stream()
                .map(ApiKeyDto::from).toList();
    }

    @Transactional
    public CreateApiKeyResponse create(CreateApiKeyRequest req) {
        Long cid = TenantContext.require();

        String randomPart = generateRandomString(32);
        String plaintext = PREFIX + randomPart;
        String hash = sha256(plaintext);
        String lastFour = randomPart.substring(randomPart.length() - 4);

        ApiKey k = ApiKey.builder()
                .companyId(cid)
                .name(req.name())
                .prefix(PREFIX)
                .keyHash(hash)
                .lastFour(lastFour)
                .scopes(req.scopes())
                .build();
        ApiKey saved = repo.save(k);

        auditLogger.log("API_KEY_CREATE", "api_key", saved.getId(),
                "name=" + saved.getName() + " ...****" + lastFour);

        return new CreateApiKeyResponse(ApiKeyDto.from(saved), plaintext);
    }

    @Transactional
    public void revoke(Long id) {
        Long cid = TenantContext.require();
        ApiKey k = repo.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> new BusinessException("API anahtarı bulunamadı"));
        if (k.getRevokedAt() != null) throw new BusinessException("Zaten iptal edilmiş");
        k.setRevokedAt(LocalDateTime.now());
        repo.save(k);
        auditLogger.log("API_KEY_REVOKE", "api_key", id, "name=" + k.getName());
    }

    /**
     * Public helper — hash karşılaştırma için. Webhook/Bearer key auth filter
     * tarafından kullanılabilir (eklendiğinde).
     */
    public static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String generateRandomString(int byteLen) {
        byte[] b = new byte[byteLen];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
