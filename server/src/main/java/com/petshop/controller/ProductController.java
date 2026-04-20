package com.petshop.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.FeaturedProductDto;
import com.petshop.dto.response.ProductResponse;
import com.petshop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<ProductResponse>>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {

        Sort.Direction direction = dir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sort));

        Page<ProductResponse> result;
        if (q != null && !q.isBlank()) {
            result = productService.search(q, pageable);
        } else if (categoryId != null) {
            result = productService.listByCategory(categoryId, pageable);
        } else {
            result = productService.search("", pageable);
        }
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }

    @GetMapping("/featured")
    public ResponseEntity<DataGenericResponse<List<FeaturedProductDto>>> featured() {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getFeatured(20)));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<DataGenericResponse<ProductResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getBySlug(slug)));
    }
}
