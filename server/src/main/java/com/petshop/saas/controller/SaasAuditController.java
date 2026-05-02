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
            @RequestParam(required = false) String action) {
        Long cid = TenantContext.require();
        planLimitService.assertFeatureSalesHistory(cid);
        String rt = (resourceType == null || resourceType.isBlank()) ? null : resourceType;
        String ac = (action == null || action.isBlank()) ? null : action;
        Page<AuditLogDto> result = auditRepo
                .search(cid, rt, ac, PageRequest.of(page, Math.min(size, 200)))
                .map(AuditLogDto::from);
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }
}
