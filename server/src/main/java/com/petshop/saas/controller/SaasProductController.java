package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.saas.dto.CreateProductRequest;
import com.petshop.saas.dto.ProductDto;
import com.petshop.saas.dto.UpdateProductRequest;
import com.petshop.saas.service.SaasProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/saas/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasProductController {

    private final SaasProductService service;

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<ProductDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(DataGenericResponse.of(service.list(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DataGenericResponse<ProductDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(DataGenericResponse.of(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<ProductDto>> create(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataGenericResponse<ProductDto>> update(@PathVariable Long id,
                                                                  @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
