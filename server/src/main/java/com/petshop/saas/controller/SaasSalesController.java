package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.saas.dto.CreateSaleRequest;
import com.petshop.saas.dto.SaleDto;
import com.petshop.saas.service.SaasSalesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/saas/sales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class SaasSalesController {

    private final SaasSalesService service;

    @PostMapping
    public ResponseEntity<DataGenericResponse<SaleDto>> create(@Valid @RequestBody CreateSaleRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.create(req)));
    }

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<SaleDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(DataGenericResponse.of(service.search(page, size, from, to, q)));
    }

    @GetMapping("/recent")
    public ResponseEntity<DataGenericResponse<List<SaleDto>>> recent() {
        return ResponseEntity.ok(DataGenericResponse.of(service.recent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DataGenericResponse<SaleDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(DataGenericResponse.of(service.getById(id)));
    }
}
