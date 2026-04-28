package com.petshop.catalog.controller;

import com.petshop.catalog.dto.response.BrandResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.catalog.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<BrandResponse>>> listActive() {
        List<BrandResponse> brands = brandRepository.findByIsActiveTrueOrderByNameAsc()
                .stream().map(BrandResponse::from).toList();
        return ResponseEntity.ok(DataGenericResponse.of(brands));
    }
}
