package com.petshop.controller.admin;

import com.petshop.constant.ProductMessages;
import com.petshop.dto.request.CategoryRequest;
import com.petshop.dto.response.CategoryResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.entity.Category;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.CategoryRepository;
import com.petshop.repository.ProductRepository;
import com.petshop.service.CategoryService;
import com.petshop.util.SlugUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @PostMapping
    public ResponseEntity<DataGenericResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category category = new Category();
        category.setName(request.name());
        category.setEmoji(request.emoji());
        category.setSlug(SlugUtil.toSlug(request.name()));
        category.setDescription(request.description());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 1);
        category.setIsActive(true);

        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), request.parentId()));
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(DataGenericResponse.of(CategoryResponse.from(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataGenericResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), id));

        category.setName(request.name());
        category.setEmoji(request.emoji());
        category.setSlug(SlugUtil.toSlug(request.name()));
        category.setDescription(request.description());
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }

        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), request.parentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(DataGenericResponse.of(CategoryResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), id));

        long productCount = productRepository.findByIsActiveTrueAndCategoryId(id,
                PageRequest.of(0, 1)).getTotalElements();

        if (productCount > 0) {
            throw new BusinessException(ProductMessages.CATEGORY_HAS_PRODUCTS.get());
        }

        categoryRepository.delete(category);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
