package com.offcats.service;

import com.offcats.dto.request.CreateProductRequest;
import com.offcats.dto.response.ProductResponse;
import com.offcats.entity.Brand;
import com.offcats.entity.Category;
import com.offcats.entity.Product;
import com.offcats.exception.ResourceNotFoundException;
import com.offcats.repository.BrandRepository;
import com.offcats.repository.CategoryRepository;
import com.offcats.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;

    // ------------------------------------------------------------------ //
    // Public read methods
    // ------------------------------------------------------------------ //

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

    // ------------------------------------------------------------------ //
    // Admin read methods
    // ------------------------------------------------------------------ //

    public Page<ProductResponse> listAll(Pageable pageable) {
        return productRepository.findAll(pageable).map(ProductResponse::from);
    }

    // ------------------------------------------------------------------ //
    // Admin write methods
    // ------------------------------------------------------------------ //

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        String slug = toSlug(req.name());

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", req.categoryId()));

        Brand brand = null;
        if (req.brandName() != null && !req.brandName().isBlank()) {
            String brandSlug = toSlug(req.brandName());
            brand = brandRepository.findBySlug(brandSlug)
                    .orElseGet(() -> brandRepository.save(
                            Brand.builder()
                                    .name(req.brandName().trim())
                                    .slug(brandSlug)
                                    .isActive(true)
                                    .build()
                    ));
        }

        Product product = Product.builder()
                .name(req.name())
                .slug(slug)
                .sku(req.sku())
                .category(category)
                .brand(brand)
                .basePrice(req.basePrice())
                .vatRate(req.vatRate() != null ? req.vatRate() : new BigDecimal("20.00"))
                .moq(req.moq() != null ? req.moq() : 1)
                .stockQuantity(req.stockQuantity() != null ? req.stockQuantity() : 0)
                .unit(req.unit() != null ? req.unit() : "adet")
                .shortDescription(req.shortDescription())
                .description(req.description())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .isFeatured(req.isFeatured() != null ? req.isFeatured() : false)
                .build();

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long id, CreateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));

        product.setName(req.name());
        product.setSlug(toSlug(req.name()));
        product.setSku(req.sku());
        product.setBasePrice(req.basePrice());

        if (req.vatRate() != null) {
            product.setVatRate(req.vatRate());
        }
        if (req.moq() != null) {
            product.setMoq(req.moq());
        }
        if (req.stockQuantity() != null) {
            product.setStockQuantity(req.stockQuantity());
        }
        if (req.unit() != null) {
            product.setUnit(req.unit());
        }
        if (req.shortDescription() != null) {
            product.setShortDescription(req.shortDescription());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        if (req.isActive() != null) {
            product.setIsActive(req.isActive());
        }
        if (req.isFeatured() != null) {
            product.setIsFeatured(req.isFeatured());
        }

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", req.categoryId()));
        product.setCategory(category);

        Brand brand = null;
        if (req.brandName() != null && !req.brandName().isBlank()) {
            String brandSlug = toSlug(req.brandName());
            brand = brandRepository.findBySlug(brandSlug)
                    .orElseGet(() -> brandRepository.save(
                            Brand.builder()
                                    .name(req.brandName().trim())
                                    .slug(brandSlug)
                                    .isActive(true)
                                    .build()
                    ));
        }
        product.setBrand(brand);

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));
        productRepository.deleteById(id);
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private String toSlug(String input) {
        if (input == null) return "";
        String result = input.trim().toLowerCase();
        result = result
                .replace('ş', 's')
                .replace('ç', 'c')
                .replace('ğ', 'g')
                .replace('ü', 'u')
                .replace('ö', 'o')
                .replace('ı', 'i')
                .replace('İ', 'i')
                .replace('Ş', 's')
                .replace('Ç', 'c')
                .replace('Ğ', 'g')
                .replace('Ü', 'u')
                .replace('Ö', 'o');
        result = result.replaceAll("[^a-z0-9\\s-]", "");
        result = result.replaceAll("[\\s]+", "-");
        result = result.replaceAll("-{2,}", "-");
        result = result.replaceAll("^-|-$", "");
        return result;
    }
}
