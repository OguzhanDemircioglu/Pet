package com.pettoptan.service;

import com.pettoptan.dto.response.CategoryResponse;
import com.pettoptan.repository.CategoryRepository;
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

    public CategoryResponse getBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new com.pettoptan.exception.ResourceNotFoundException("Kategori: " + slug));
    }
}
