package com.petshop.catalog.controller;

import com.petshop.catalog.dto.response.CategoryFlatResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.catalog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@ConditionalOnProperty(name = "features.legacy-ecommerce", havingValue = "true", matchIfMissing = false)
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<CategoryFlatResponse>>> getAll() {
        return ResponseEntity.ok(DataGenericResponse.of(categoryService.getAllFlat()));
    }
}
