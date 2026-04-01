package com.pettoptan.service;

import com.pettoptan.dto.response.ProductResponse;
import com.pettoptan.entity.Product;
import com.pettoptan.exception.ResourceNotFoundException;
import com.pettoptan.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public Page<ProductResponse> listByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByIsActiveTrueAndCategoryId(categoryId, pageable)
                .map(ProductResponse::from);
    }

    public Page<ProductResponse> search(String query, Pageable pageable) {
        return productRepository.search(query, pageable)
                .map(ProductResponse::from);
    }

    public ProductResponse getBySlug(String slug) {
        Product p = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + slug));
        return ProductResponse.from(p);
    }

    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));
        return ProductResponse.from(p);
    }

    public List<ProductResponse> getFeatured() {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrueOrderByCreatedAtDesc()
                .stream().map(ProductResponse::from).toList();
    }
}
