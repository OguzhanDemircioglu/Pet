package com.petshop.catalog.controller.admin;

import com.petshop.catalog.constant.ProductMessages;
import com.petshop.catalog.dto.request.BrandRequest;
import com.petshop.catalog.dto.response.BrandResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.catalog.entity.Brand;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.catalog.repository.BrandRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/brands")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<BrandResponse>>> list() {
        List<BrandResponse> brands = brandRepository.findAll(Sort.by("name"))
                .stream().map(BrandResponse::from).toList();
        return ResponseEntity.ok(DataGenericResponse.of(brands));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<BrandResponse>> create(@Valid @RequestBody BrandRequest req) {
        if (brandRepository.existsByNameIgnoreCase(req.name().trim())) {
            throw new BusinessException(ProductMessages.BRAND_ALREADY_EXISTS.get());
        }
        Brand brand = Brand.builder()
                .name(req.name().trim())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DataGenericResponse.of(BrandResponse.from(brandRepository.save(brand))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataGenericResponse<BrandResponse>> update(@PathVariable Long id, @Valid @RequestBody BrandRequest req) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.BRAND_NOT_FOUND.get(), id));
        brand.setName(req.name().trim());
        if (req.isActive() != null) brand.setIsActive(req.isActive());
        return ResponseEntity.ok(DataGenericResponse.of(BrandResponse.from(brandRepository.save(brand))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> delete(@PathVariable Long id) {
        brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.BRAND_NOT_FOUND.get(), id));
        brandRepository.deleteById(id);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
