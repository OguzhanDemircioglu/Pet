package com.petshop.siteadmin.controller.admin;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.siteadmin.dto.request.SiteSettingsRequest;
import com.petshop.siteadmin.dto.response.SiteSettingsResponse;
import com.petshop.siteadmin.service.SiteSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/site-settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSiteSettingsController {

    private final SiteSettingsService service;

    @GetMapping
    public ResponseEntity<DataGenericResponse<SiteSettingsResponse>> get() {
        return ResponseEntity.ok(DataGenericResponse.of(service.getPublic()));
    }

    @PutMapping
    public ResponseEntity<DataGenericResponse<SiteSettingsResponse>> update(@Valid @RequestBody SiteSettingsRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.update(req)));
    }
}
