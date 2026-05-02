package com.petshop.saas.controller;

import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.repository.UserRepository;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.PlanInfoDto;
import com.petshop.saas.dto.PlanUpgradeRequest;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Plan yükseltme/düşürme endpoint'i. Şu an MVP — Stripe entegrasyonu yok,
 * doğrudan Plan değiştirir. Production'da bu controller'ın önüne ödeme
 * akışı eklenmeli (sub-status, billing webhook, vb).
 *
 * Plan değişimi sonrası tokenVersion artırılır → frontend'in token'ı
 * geçersizleşir, refresh ile yeni plan claim'i alır.
 */
@RestController
@RequestMapping("/admin/saas/plan")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasPlanController {

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final UserRepository userRepository;
    private final AuthFacade authFacade;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<DataGenericResponse<PlanInfoDto>> info() {
        Long cid = TenantContext.require();
        Company c = companyService.getById(cid);
        return ResponseEntity.ok(DataGenericResponse.of(new PlanInfoDto(
                c.getPlan(), Plan.values(), c.getId(), c.getName(), c.getSlug()
        )));
    }

    @PostMapping("/change")
    @Transactional
    public ResponseEntity<DataGenericResponse<PlanInfoDto>> change(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PlanUpgradeRequest req) {
        Long cid = TenantContext.require();
        Company c = companyService.getById(cid);

        if (c.getPlan() == req.plan()) {
            throw new BusinessException("Zaten bu plandasınız: " + req.plan());
        }

        Plan oldPlan = c.getPlan();
        c.setPlan(req.plan());
        companyRepository.save(c);
        auditLogger.log("PLAN_CHANGE", "company", c.getId(), "from=" + oldPlan + " to=" + req.plan());

        // Şirketin tüm kullanıcılarının token'larını geçersiz kıl
        // (yeni plan claim'i bir sonraki login'de gelir)
        userRepository.findByCompanyIdOrderByCreatedAtDesc(cid).forEach(u -> {
            authFacade.bumpTokenVersion(u.getId());
        });

        return ResponseEntity.ok(DataGenericResponse.of(new PlanInfoDto(
                c.getPlan(), Plan.values(), c.getId(), c.getName(), c.getSlug()
        )));
    }
}
