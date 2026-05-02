package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.saas.dto.ApiKeyDto;
import com.petshop.saas.dto.CreateApiKeyRequest;
import com.petshop.saas.dto.CreateApiKeyResponse;
import com.petshop.saas.service.SaasApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/saas/api-keys")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasApiKeyController {

    private final SaasApiKeyService service;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<ApiKeyDto>>> list() {
        return ResponseEntity.ok(DataGenericResponse.of(service.list()));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<CreateApiKeyResponse>> create(@Valid @RequestBody CreateApiKeyRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.create(req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> revoke(@PathVariable Long id) {
        service.revoke(id);
        return ResponseEntity.ok(GenericResponse.ok("API anahtarı iptal edildi"));
    }
}
