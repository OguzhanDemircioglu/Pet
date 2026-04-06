package com.offcats.controller.admin;

import com.offcats.dto.request.BrandRequest;
import com.offcats.dto.response.BrandResponse;
import com.offcats.entity.Brand;
import com.offcats.repository.BrandRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/admin/brands")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public List<BrandResponse> list() {
        return brandRepository.findAll(Sort.by("name"))
                .stream().map(BrandResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<BrandResponse> create(@Valid @RequestBody BrandRequest req) {
        boolean exists = brandRepository.findAll().stream()
                .anyMatch(b -> b.getName().equalsIgnoreCase(req.name().trim()));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu isimde marka zaten var");
        }
        Brand brand = Brand.builder()
                .name(req.name().trim())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(BrandResponse.from(brandRepository.save(brand)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandResponse> update(@PathVariable Long id, @Valid @RequestBody BrandRequest req) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marka bulunamadı: " + id));
        brand.setName(req.name().trim());
        if (req.isActive() != null) brand.setIsActive(req.isActive());
        return ResponseEntity.ok(BrandResponse.from(brandRepository.save(brand)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        brandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marka bulunamadı: " + id));
        brandRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
