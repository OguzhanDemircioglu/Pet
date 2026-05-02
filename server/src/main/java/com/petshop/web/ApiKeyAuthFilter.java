package com.petshop.web;

import com.petshop.saas.service.SaasApiKeyService;
import com.petshop.tenant.entity.ApiKey;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.repository.ApiKeyRepository;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * X-API-Key header ile API anahtarı tabanlı kimlik doğrulama.
 * Webhook'lar ve 3rd party entegrasyonlar bu yolu kullanır.
 *
 * - JWT auth filter'dan ÖNCE çalışır (Authorization header yoksa devreye girer)
 * - Bulunan key'in companyId'si TenantContext'e set edilir
 * - SecurityContext'e ROLE_ADMIN authority'si eklenir (key'in scope'una göre kısıtlanabilir, MVP'de tam yetki)
 * - last_used_at async güncellenir (her isteği bloklamaz)
 * - Revoke edilmiş key → 401
 */
@Component
@Order(1) // RateLimitFilter'dan sonra, JwtAuthenticationFilter'dan önce
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyRepository apiKeyRepository;
    private final CompanyRepository companyRepository;
    private final ApiKeyTouchService touchService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("X-API-Key");
        boolean tenantSet = false;

        if (header != null && !header.isBlank() && header.startsWith("pt_live_")) {
            String hash = SaasApiKeyService.sha256(header);
            Optional<ApiKey> keyOpt = apiKeyRepository.findByKeyHash(hash);
            if (keyOpt.isEmpty()) {
                log.debug("API key not found");
                send401(res, "Geçersiz API anahtarı");
                return;
            }
            ApiKey key = keyOpt.get();
            if (key.getRevokedAt() != null) {
                send401(res, "API anahtarı iptal edilmiş");
                return;
            }
            Company company = companyRepository.findById(key.getCompanyId()).orElse(null);
            if (company == null || !Boolean.TRUE.equals(company.getIsActive())) {
                send401(res, "Şirket aktif değil");
                return;
            }

            // last_used_at async güncelle (request'i bloklamaz, transaction propagation sorunu yaratmaz)
            touchService.touchAsync(key.getId());

            // SecurityContext'i kur
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "api-key:" + key.getId(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_API"), new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            TenantContext.set(company.getId(), company.getPlan().name());
            tenantSet = true;
        }

        try {
            chain.doFilter(req, res);
        } finally {
            if (tenantSet) TenantContext.clear();
        }
    }

    private void send401(HttpServletResponse res, String msg) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json");
        res.getWriter().write("{\"success\":false,\"message\":\"" + msg + "\",\"errors\":{\"code\":\"INVALID_API_KEY\"}}");
    }

    @Component
    @RequiredArgsConstructor
    static class ApiKeyTouchService {
        private final ApiKeyRepository repo;

        @Async
        @org.springframework.transaction.annotation.Transactional
        public void touchAsync(Long keyId) {
            try {
                repo.findById(keyId).ifPresent(k -> {
                    k.setLastUsedAt(LocalDateTime.now());
                    repo.save(k);
                });
            } catch (Exception ignored) {
                // last_used_at update başarısız olursa sessizce geç — request başarılı
            }
        }
    }
}
