package com.petshop.catalog.api;

import com.petshop.catalog.constant.ProductMessages;
import com.petshop.catalog.api.events.StockRestoredEvent;
import com.petshop.catalog.entity.Brand;
import com.petshop.catalog.entity.Category;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.entity.ProductVariant;
import com.petshop.catalog.repository.BrandRepository;
import com.petshop.catalog.repository.CategoryRepository;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.catalog.repository.ProductVariantRepository;
import com.petshop.catalog.service.CategoryService;
import com.petshop.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
class CatalogFacadeImpl implements CatalogFacade {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductSummary> findProduct(Long productId) {
        if (productId == null) return Optional.empty();
        return productRepository.findById(productId).map(CatalogFacadeImpl::toProductSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductSummary> findProductBySlug(String slug) {
        if (slug == null || slug.isBlank()) return Optional.empty();
        return productRepository.findBySlug(slug).map(CatalogFacadeImpl::toProductSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, ProductSummary> findProducts(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();
        return productRepository.findAllById(new HashSet<>(productIds)).stream()
                .map(CatalogFacadeImpl::toProductSummary)
                .collect(Collectors.toMap(ProductSummary::id, Function.identity()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VariantSummary> findVariant(Long variantId) {
        if (variantId == null) return Optional.empty();
        return variantRepository.findById(variantId).map(CatalogFacadeImpl::toVariantSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, VariantSummary> findVariants(Collection<Long> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) return Map.of();
        return variantRepository.findAllById(new HashSet<>(variantIds)).stream()
                .map(CatalogFacadeImpl::toVariantSummary)
                .collect(Collectors.toMap(VariantSummary::id, Function.identity()));
    }

    @Override
    @Transactional(readOnly = true)
    public void assertAvailable(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            ProductVariant v = variantRepository.findById(variantId).orElse(null);
            if (v == null) return;
            int avail = v.getAvailableStock();
            if (avail < qty) {
                throw new StockInsufficientException(
                        ProductMessages.INSUFFICIENT_STOCK.format(v.getLabel(), avail, qty),
                        productId, variantId, qty, avail);
            }
        } else if (productId != null) {
            Product p = productRepository.findById(productId).orElse(null);
            if (p == null) return;
            int avail = p.getStockQuantity();
            if (avail < qty) {
                throw new StockInsufficientException(
                        ProductMessages.INSUFFICIENT_STOCK.format(p.getName(), avail, qty),
                        productId, null, qty, avail);
            }
        }
    }

    @Override
    @Transactional
    public void decrementStock(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            ProductVariant v = variantRepository.findById(variantId).orElse(null);
            if (v == null) return;
            int avail = v.getAvailableStock();
            if (avail < qty) {
                throw new StockInsufficientException(
                        ProductMessages.INSUFFICIENT_STOCK.format(v.getLabel(), avail, qty),
                        productId, variantId, qty, avail);
            }
            v.setStockQuantity(v.getStockQuantity() - qty);
            variantRepository.save(v);
        } else if (productId != null) {
            Product p = productRepository.findById(productId).orElse(null);
            if (p == null) return;
            int avail = p.getStockQuantity();
            if (avail < qty) {
                throw new StockInsufficientException(
                        ProductMessages.INSUFFICIENT_STOCK.format(p.getName(), avail, qty),
                        productId, null, qty, avail);
            }
            p.setStockQuantity(p.getStockQuantity() - qty);
            productRepository.save(p);
        }
    }

    @Override
    @Transactional
    public void restoreStock(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            ProductVariant v = variantRepository.findById(variantId).orElse(null);
            if (v == null) return;
            v.setStockQuantity(v.getStockQuantity() + qty);
            variantRepository.save(v);
        } else if (productId != null) {
            Product p = productRepository.findById(productId).orElse(null);
            if (p == null) return;
            p.setStockQuantity(p.getStockQuantity() + qty);
            productRepository.save(p);
        }
    }

    @Override
    public void fireStockBackIfSubscribed(Long productId, Long variantId) {
        events.publishEvent(new StockRestoredEvent(productId, variantId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findCategoryName(Long categoryId) {
        if (categoryId == null) return Optional.empty();
        return categoryRepository.findById(categoryId).map(Category::getName);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findBrandName(Long brandId) {
        if (brandId == null) return Optional.empty();
        return brandRepository.findById(brandId).map(Brand::getName);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, String> findCategoryNames(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return categoryRepository.findAllById(new HashSet<>(ids)).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, String> findBrandNames(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return brandRepository.findAllById(new HashSet<>(ids)).stream()
                .collect(Collectors.toMap(Brand::getId, Brand::getName));
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.CatalogProductDto> getAllCatalog() {
        return productService.getAllCatalog();
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getFeatured(int limit) {
        return productService.getFeatured(limit);
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.CategoryFlatResponse> getAllFlatCategories() {
        return categoryService.getAllFlat();
    }

    @Override
    @Transactional
    public void updateProductRating(Long productId, java.math.BigDecimal avgRating, Integer reviewCount) {
        if (productId == null) return;
        productRepository.findById(productId).ifPresent(p -> {
            p.setAvgRating(avgRating);
            p.setReviewCount(reviewCount);
            productRepository.save(p);
        });
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getFeaturedByIds(java.util.List<Long> productIds) {
        return productService.getFeaturedByIds(productIds);
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getDeals(int limit) {
        return productService.getDeals(limit);
    }

    @Override
    public java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getNewArrivals(int limit) {
        return productService.getNewArrivals(limit);
    }

    static ProductSummary toProductSummary(Product p) {
        return new ProductSummary(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getSku(),
                p.getBasePrice(),
                p.getAvailableStock(),
                Boolean.TRUE.equals(p.getIsActive()),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getBrand() != null ? p.getBrand().getId() : null
        );
    }

    static VariantSummary toVariantSummary(ProductVariant v) {
        return new VariantSummary(
                v.getId(),
                v.getProduct() != null ? v.getProduct().getId() : null,
                v.getLabel(),
                v.getPrice(),
                v.getAvailableStock(),
                Boolean.TRUE.equals(v.getIsActive())
        );
    }
}
