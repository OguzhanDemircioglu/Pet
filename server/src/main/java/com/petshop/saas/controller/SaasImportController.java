package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.saas.dto.BulkImportResult;
import com.petshop.saas.service.SaasImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/saas/import")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class SaasImportController {

    private final SaasImportService service;

    @PostMapping(value = "/products", consumes = "multipart/form-data")
    public ResponseEntity<DataGenericResponse<BulkImportResult>> importProducts(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(DataGenericResponse.of(service.importProductsCsv(file)));
    }

    @PostMapping(value = "/products/update", consumes = "multipart/form-data")
    public ResponseEntity<DataGenericResponse<BulkImportResult>> updateProducts(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(DataGenericResponse.of(service.updateProductsCsv(file)));
    }
}
