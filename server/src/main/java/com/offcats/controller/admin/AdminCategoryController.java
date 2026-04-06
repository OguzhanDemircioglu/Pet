package com.offcats.controller.admin;

import com.offcats.dto.request.CategoryRequest;
import com.offcats.dto.response.CategoryResponse;
import com.offcats.entity.Category;
import com.offcats.repository.CategoryRepository;
import com.offcats.repository.ProductRepository;
import com.offcats.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category category = new Category();
        category.setName(request.name());
        category.setEmoji(request.emoji());
        category.setSlug(toSlug(request.name()));
        category.setDescription(request.description());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 1);
        category.setIsActive(true);

        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üst kategori bulunamadı: " + request.parentId()));
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoryResponse.from(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategori bulunamadı: " + id));

        category.setName(request.name());
        category.setEmoji(request.emoji());
        category.setSlug(toSlug(request.name()));
        category.setDescription(request.description());
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }

        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Üst kategori bulunamadı: " + request.parentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(CategoryResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategori bulunamadı: " + id));

        long productCount = productRepository.findByIsActiveTrueAndCategoryId(id,
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

        if (productCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bu kategoride ürün var, önce ürünleri taşıyın");
        }

        categoryRepository.delete(category);
        return ResponseEntity.noContent().build();
    }

    private static String toSlug(String input) {
        if (input == null) return "";
        String s = input.toLowerCase()
                .replace('ş', 's')
                .replace('ç', 'c')
                .replace('ğ', 'g')
                .replace('ü', 'u')
                .replace('ö', 'o')
                .replace('ı', 'i');
        s = s.replaceAll("[^a-z0-9]+", "-");
        s = s.replaceAll("^-+|-+$", "");
        return s;
    }
}
