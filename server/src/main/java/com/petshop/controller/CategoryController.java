package com.petshop.controller;

import com.petshop.dto.response.CategoryFlatResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
