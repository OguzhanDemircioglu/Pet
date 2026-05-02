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
@PreAuthorize("hasRole('ADMIN')")
public class SaasSalesController {

    private final SaasSalesService service;

    @PostMapping
    public ResponseEntity<DataGenericResponse<SaleDto>> create(@Valid @RequestBody CreateSaleRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.create(req)));
    }

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<SaleDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(DataGenericResponse.of(service.list(page, size)));
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
