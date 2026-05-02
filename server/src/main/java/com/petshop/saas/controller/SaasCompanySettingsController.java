package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.CompanySettingsDto;
import com.petshop.saas.dto.UpdateCompanySettingsRequest;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/saas/company")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasCompanySettingsController {

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @GetMapping("/settings")
    public ResponseEntity<DataGenericResponse<CompanySettingsDto>> get() {
        Long cid = TenantContext.require();
        Company c = companyService.getById(cid);
        return ResponseEntity.ok(DataGenericResponse.of(CompanySettingsDto.from(c)));
    }

    @PutMapping("/settings")
    @Transactional
    public ResponseEntity<DataGenericResponse<CompanySettingsDto>> update(@Valid @RequestBody UpdateCompanySettingsRequest req) {
        Long cid = TenantContext.require();
        Company c = companyService.getById(cid);

        boolean wantsAlerts = (Boolean.TRUE.equals(req.lowStockAlertEnabled()) || Boolean.TRUE.equals(req.dailySummaryEnabled()));
        if (wantsAlerts && c.getPlan() == Plan.FREE) {
            throw new BusinessException("E-posta bildirimleri PRO plan ile açılır");
        }

        if (req.name() != null && !req.name().isBlank()) c.setName(req.name());
        if (req.lowStockThreshold() != null) c.setLowStockThreshold(req.lowStockThreshold());
        if (req.lowStockAlertEnabled() != null) c.setLowStockAlertEnabled(req.lowStockAlertEnabled());
        if (req.dailySummaryEnabled() != null) c.setDailySummaryEnabled(req.dailySummaryEnabled());
        if (req.notificationEmail() != null) {
            c.setNotificationEmail(req.notificationEmail().isBlank() ? null : req.notificationEmail());
        }
        Company saved = companyRepository.save(c);
        auditLogger.log("COMPANY_SETTINGS_UPDATE", "company", saved.getId(),
                "lowStock=" + saved.getLowStockAlertEnabled() + " threshold=" + saved.getLowStockThreshold());
        return ResponseEntity.ok(DataGenericResponse.of(CompanySettingsDto.from(saved)));
    }
}
