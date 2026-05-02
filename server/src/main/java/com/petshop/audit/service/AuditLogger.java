package com.petshop.audit.service;

import com.petshop.audit.entity.AuditLog;
import com.petshop.audit.repository.AuditLogRepository;
import com.petshop.tenant.service.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogger {

    private final AuditLogRepository repo;

    /**
     * Tenant-aware audit log. TenantContext + SecurityContext + request IP
     * çağrı thread'inden okunur, sonra async yazılır.
     *
     * Üst işlem rollback olursa audit log da silinir mi? Hayır — REQUIRES_NEW
     * ile bağımsız transaction'da çalışır, böylece "denemeler" de izlenir.
     */
    public void log(String action, String resourceType, Long resourceId, String details) {
        Long companyId = TenantContext.get();
        if (companyId == null) return;
        Long userId = currentUserId();
        String ip = currentIp();
        // Sync metoda devret — caller thread'den context yakaladık
        persistAsync(companyId, userId, action, resourceType, resourceId, details, ip);
    }

    @Async
    public void persistAsync(Long companyId, Long userId, String action, String resourceType,
                             Long resourceId, String details, String ip) {
        try {
            persist(companyId, userId, action, resourceType, resourceId, details, ip);
        } catch (Exception e) {
            log.warn("AuditLogger persist failed: action={} err={}", action, e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persist(Long companyId, Long userId, String action, String resourceType,
                        Long resourceId, String details, String ip) {
        AuditLog entry = AuditLog.builder()
                .companyId(companyId)
                .userId(userId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .details(safeTrunc(details, 4000))
                .ip(ip)
                .build();
        repo.save(entry);
    }

    private Long currentUserId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Long uid) return uid;
        } catch (Exception ignored) {}
        return null;
    }

    private String currentIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest req = attrs.getRequest();
            String xff = req.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                int c = xff.indexOf(',');
                return (c < 0 ? xff : xff.substring(0, c)).trim();
            }
            return req.getRemoteAddr();
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String safeTrunc(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
