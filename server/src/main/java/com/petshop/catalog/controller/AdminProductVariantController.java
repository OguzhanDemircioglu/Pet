package com.petshop.catalog.controller;

import com.petshop.catalog.dto.request.ProductVariantRequest;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.catalog.dto.response.ProductVariantResponse;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.entity.ProductVariant;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.catalog.repository.ProductVariantRepository;
import com.petshop.catalog.api.events.StockRestoredEvent;
import jakarta.validation.Valid;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/products/{productId}/variants")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProductVariantController {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public DataGenericResponse<List<ProductVariantResponse>> list(@PathVariable Long productId) {
        requireProduct(productId);
        List<ProductVariantResponse> variants = variantRepository
                .findByProductIdOrderByDisplayOrderAsc(productId)
                .stream().map(ProductVariantResponse::from).toList();
        return DataGenericResponse.of(variants);
    }

    @PostMapping
    public DataGenericResponse<ProductVariantResponse> create(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantRequest req) {
        Product product = requireProduct(productId);
        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .label(req.label())
                .price(req.price())
                .stockQuantity(req.stockQuantity() != null ? req.stockQuantity() : 0)
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build();
        return DataGenericResponse.of(ProductVariantResponse.from(variantRepository.save(variant)));
    }

    @PutMapping("/{variantId}")
    public DataGenericResponse<ProductVariantResponse> update(
            @PathVariable Long productId,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest req) {
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Varyant bulunamadı", variantId));
        int previousAvailable = variant.getAvailableStock();
        variant.setLabel(req.label());
        variant.setPrice(req.price());
        if (req.stockQuantity() != null) variant.setStockQuantity(req.stockQuantity());
        if (req.displayOrder() != null) variant.setDisplayOrder(req.displayOrder());
        if (req.isActive() != null) variant.setIsActive(req.isActive());
        ProductVariant saved = variantRepository.save(variant);
        if (previousAvailable <= 0 && saved.getAvailableStock() > 0 && Boolean.TRUE.equals(saved.getIsActive())) {
            eventPublisher.publishEvent(new StockRestoredEvent(null, saved.getId()));
        }
        return DataGenericResponse.of(ProductVariantResponse.from(saved));
    }

    @DeleteMapping("/{variantId}")
    public GenericResponse delete(@PathVariable Long productId, @PathVariable Long variantId) {
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Varyant bulunamadı", variantId));
        variantRepository.delete(variant);
        return GenericResponse.ok();
    }

    private Product requireProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı", productId));
    }
}
