package com.offcats.service;

import com.offcats.dto.request.CreateProductRequest;
import com.offcats.dto.response.ProductResponse;
import com.offcats.entity.*;
import com.offcats.exception.ResourceNotFoundException;
import com.offcats.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductDiscountRepository productDiscountRepo;
    private final CategoryDiscountRepository categoryDiscountRepo;
    private final BrandDiscountRepository brandDiscountRepo;

    // ─── Public listing ───────────────────────────────────────────────────────

    public Page<ProductResponse> listByCategory(Long categoryId, Pageable pageable) {
        return enrichPage(productRepository.findByIsActiveTrueAndCategoryId(categoryId, pageable), pageable);
    }

    public Page<ProductResponse> search(String query, Pageable pageable) {
        return enrichPage(productRepository.search(query, pageable), pageable);
    }

    public ProductResponse getBySlug(String slug) {
        Product p = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + slug));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        return ProductResponse.fromWithDiscount(p, dm.get(p.getId()));
    }

    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        return ProductResponse.fromWithDiscount(p, dm.get(p.getId()));
    }

    public List<ProductResponse> getFeatured() {
        List<Product> products = productRepository.findByIsFeaturedTrueAndIsActiveTrueOrderByCreatedAtDesc();
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        return products.stream().map(p -> ProductResponse.fromWithDiscount(p, dm.get(p.getId()))).toList();
    }

    public Page<ProductResponse> listAll(Pageable pageable) {
        return enrichPage(productRepository.findAll(pageable), pageable);
    }

    // ─── Admin CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        String slug = toSlug(req.name());

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", req.categoryId()));

        Brand brand = null;
        if (req.brandId() != null) {
            brand = brandRepository.findById(req.brandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Marka", req.brandId()));
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

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, CreateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));

        product.setName(req.name());
        product.setSlug(toSlug(req.name()));
        product.setSku(req.sku());
        product.setBasePrice(req.basePrice());

        if (req.vatRate() != null) product.setVatRate(req.vatRate());
        if (req.moq() != null) product.setMoq(req.moq());
        if (req.stockQuantity() != null) product.setStockQuantity(req.stockQuantity());
        if (req.unit() != null) product.setUnit(req.unit());
        if (req.shortDescription() != null) product.setShortDescription(req.shortDescription());
        if (req.description() != null) product.setDescription(req.description());
        if (req.isActive() != null) product.setIsActive(req.isActive());
        if (req.isFeatured() != null) product.setIsFeatured(req.isFeatured());

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", req.categoryId()));
        product.setCategory(category);

        Brand brand = null;
        if (req.brandId() != null) {
            brand = brandRepository.findById(req.brandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Marka", req.brandId()));
        }
        product.setBrand(brand);

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", id));
        productRepository.deleteById(id);
    }

    // ─── Discount helpers ─────────────────────────────────────────────────────

    private Page<ProductResponse> enrichPage(Page<Product> page, Pageable pageable) {
        if (page.isEmpty()) return Page.empty(pageable);
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        List<ProductResponse> enriched = page.getContent().stream()
                .map(p -> ProductResponse.fromWithDiscount(p, dm.get(p.getId())))
                .toList();
        return new PageImpl<>(enriched, pageable, page.getTotalElements());
    }

    /**
     * Tüm aktif indirimleri yükler ve her ürün id'si → en iyi indirim map'i döndürür.
     * Öncelik: ürün indirim > kategori indirim > marka indirim
     */
    private Map<Long, ProductResponse.ActiveDiscountDto> buildDiscountMap() {
        LocalDateTime now = LocalDateTime.now();
        Map<Long, ProductResponse.ActiveDiscountDto> map = new HashMap<>();

        // Marka indirimleri (en düşük öncelik)
        brandDiscountRepo.findAll().stream()
                .filter(d -> isActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> productRepository.findByIsActiveTrueAndBrandId(d.getBrand().getId())
                        .forEach(p -> map.merge(p.getId(),
                                toDto(d.getName(), d.getDiscountType().name(), d.getDiscountValue()),
                                this::better)));

        // Kategori indirimleri
        categoryDiscountRepo.findAll().stream()
                .filter(d -> isActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> productRepository.findByIsActiveTrueAndCategoryId(d.getCategory().getId(), Pageable.unpaged())
                        .getContent().forEach(p -> map.merge(p.getId(),
                                toDto(d.getName(), d.getDiscountType().name(), d.getDiscountValue()),
                                this::better)));

        // Ürün indirimleri (en yüksek öncelik — her zaman üzerine yazar)
        productDiscountRepo.findAll().stream()
                .filter(d -> isActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> map.put(d.getProduct().getId(),
                        toDto(d.getName(), d.getDiscountType().name(), d.getDiscountValue())));

        return map;
    }

    private ProductResponse.ActiveDiscountDto toDto(String name, String discountType, BigDecimal value) {
        String label = "PERCENT".equals(discountType)
                ? "%" + value.stripTrailingZeros().toPlainString()
                : value.stripTrailingZeros().toPlainString() + " ₺";
        return new ProductResponse.ActiveDiscountDto(label, discountType, value, name);
    }

    private ProductResponse.ActiveDiscountDto better(ProductResponse.ActiveDiscountDto a, ProductResponse.ActiveDiscountDto b) {
        return a.discountValue().compareTo(b.discountValue()) >= 0 ? a : b;
    }

    private boolean isActive(Boolean active, LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (!Boolean.TRUE.equals(active)) return false;
        if (start != null && now.isBefore(start)) return false;
        if (end != null && now.isAfter(end)) return false;
        return true;
    }

    // ─── Slug ─────────────────────────────────────────────────────────────────

    private String toSlug(String input) {
        if (input == null) return "";
        String result = input.trim().toLowerCase();
        result = result
                .replace('ş', 's').replace('ç', 'c').replace('ğ', 'g')
                .replace('ü', 'u').replace('ö', 'o').replace('ı', 'i')
                .replace('İ', 'i').replace('Ş', 's').replace('Ç', 'c')
                .replace('Ğ', 'g').replace('Ü', 'u').replace('Ö', 'o');
        result = result.replaceAll("[^a-z0-9\\s-]", "");
        result = result.replaceAll("[\\s]+", "-");
        result = result.replaceAll("-{2,}", "-");
        result = result.replaceAll("^-|-$", "");
        return result;
    }
}
