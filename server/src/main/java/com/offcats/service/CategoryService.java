package com.offcats.service;

import com.offcats.dto.response.CategoryFlatResponse;
import com.offcats.dto.response.CategoryResponse;
import com.offcats.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getNavCategories() {
        Set<Long> withProducts = categoryRepository.findCategoryIdsWithActiveProducts();
        return categoryRepository.findTopLevelWithChildren()
                .stream()
                .map(c -> CategoryResponse.from(c, withProducts))
                .filter(c -> !c.children().isEmpty())
                .toList();
    }

    public List<CategoryFlatResponse> getAllFlat() {
        Set<Long> withProducts = categoryRepository.findCategoryIdsWithActiveProducts();
        return categoryRepository.findAllActiveOrderByName().stream()
                .map(c -> new CategoryFlatResponse(
                        c.getId(),
                        c.getName(),
                        c.getSlug(),
                        c.getParent() != null ? c.getParent().getId() : null,
                        withProducts.contains(c.getId())
                ))
                .toList();
    }

    public CategoryResponse getBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new com.offcats.exception.ResourceNotFoundException("Kategori: " + slug));
    }
}
