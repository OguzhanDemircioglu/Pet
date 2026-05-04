package com.petshop.saas.controller;

import com.petshop.audit.repository.AuditLogRepository;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.saas.dto.AuditLogDto;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/saas/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasAuditController {

    private final AuditLogRepository auditRepo;
    private final PlanLimitService planLimitService;

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<AuditLogDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        Long cid = TenantContext.require();
        planLimitService.assertFeatureSalesHistory(cid);
        // Sentinels match the AuditLogRepository.search() contract — never pass null.
        String rt = (resourceType == null || resourceType.isBlank()) ? "" : resourceType;
        String ac = (action == null || action.isBlank()) ? "" : action;
        java.time.LocalDateTime fromDt = from != null
                ? from.atStartOfDay()
                : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime toDt = to != null
                ? to.plusDays(1).atStartOfDay()
                : java.time.LocalDateTime.of(9999, 12, 31, 0, 0);
        Long rid = resourceId != null ? resourceId : -1L;
        Page<AuditLogDto> result = auditRepo
                .search(cid, rt, ac, fromDt, toDt, rid, PageRequest.of(page, Math.min(size, 200)))
                .map(AuditLogDto::from);
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }
}
