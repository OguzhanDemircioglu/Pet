package com.petshop.service;

import com.petshop.dto.request.CreateProductRequest;
import com.petshop.dto.response.CatalogProductDto;
import com.petshop.dto.response.FeaturedProductDto;
import com.petshop.dto.response.ProductResponse;
import com.petshop.entity.*;
import com.petshop.constant.AppConstants;
import com.petshop.constant.ProductMessages;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.*;
import com.petshop.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
    private final ProductReviewRepository productReviewRepository;

    // ─── Public listing ───────────────────────────────────────────────────────

    public Page<ProductResponse> listByCategory(Long categoryId, Pageable pageable) {
        return enrichPageWithImages(productRepository.findByCategoryPaged(categoryId, pageable), pageable);
    }

    public Page<ProductResponse> search(String query, Pageable pageable) {
        return enrichPageWithImages(productRepository.searchPaged(query, pageable), pageable);
    }

    public ProductResponse getBySlug(String slug) {
        Product p = productRepository.findBySlugWithDetails(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get() + " bulunamadı: " + slug));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        Double avg = productReviewRepository.findAverageRatingByProductId(p.getId());
        int cnt = (int) productReviewRepository.countByProductId(p.getId());
        return ProductResponse.fromWithDetails(p, dm.get(p.getId()), avg, cnt > 0 ? cnt : null);
    }

    public ProductResponse getById(Long id) {
        Product p = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get(), id));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        Double avg = productReviewRepository.findAverageRatingByProductId(p.getId());
        int cnt = (int) productReviewRepository.countByProductId(p.getId());
        return ProductResponse.fromWithDetails(p, dm.get(p.getId()), avg, cnt > 0 ? cnt : null);
    }

    public List<FeaturedProductDto> getFeatured(int limit) {
        List<Product> products = productRepository.findFeaturedWithImages(PageRequest.of(0, limit));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        return products.stream().map(p -> toFeaturedDto(p, dm.get(p.getId()))).toList();
    }

    public List<CatalogProductDto> getAllCatalog() {
        List<Product> all = productRepository.findAllActiveWithImages();
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        return all.stream().map(p -> toCatalogDto(p, dm.get(p.getId()))).toList();
    }

    private CatalogProductDto toCatalogDto(Product p, ProductResponse.ActiveDiscountDto disc) {
        String primaryImage = p.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        List<CatalogProductDto.ImageDto> images = p.getImages().stream()
                .map(i -> new CatalogProductDto.ImageDto(i.getId(), i.getImageUrl(), i.getIsPrimary(), i.getDisplayOrder()))
                .toList();

        CatalogProductDto.ActiveDiscountDto discDto = disc == null ? null :
                new CatalogProductDto.ActiveDiscountDto(
                        disc.label(), disc.discountType(), disc.discountValue());

        return new CatalogProductDto(
                p.getId(), p.getName(), p.getSlug(),
                p.getSku(),
                p.getShortDescription(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getCategory() != null ? p.getCategory().getSlug() : null,
                p.getBrand() != null ? p.getBrand().getId() : null,
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(), p.getVatRate(), p.getMinSellingQuantity(),
                p.getAvailableStock(), p.getUnit(),
                p.getIsActive(), p.getIsFeatured(),
                primaryImage, images, discDto
        );
    }

    private FeaturedProductDto toFeaturedDto(Product p, ProductResponse.ActiveDiscountDto disc) {
        String primaryImage = p.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        FeaturedProductDto.ActiveDiscountDto discDto = disc == null ? null :
                new FeaturedProductDto.ActiveDiscountDto(
                        disc.label(), disc.discountType(), disc.discountValue());

        return new FeaturedProductDto(
                p.getId(), p.getName(), p.getSlug(),
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(), p.getMinSellingQuantity(), p.getAvailableStock(),
                p.getUnit(), primaryImage, discDto
        );
    }

    public Page<ProductResponse> listAll(Pageable pageable) {
        return enrichPageWithImages(productRepository.findAll(pageable), pageable);
    }

    // ─── Admin CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        String slug = SlugUtil.toSlug(req.name());

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), req.categoryId()));

        Brand brand = null;
        if (req.brandId() != null) {
            brand = brandRepository.findById(req.brandId())
                    .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.BRAND_NOT_FOUND.get(), req.brandId()));
        }

        Product product = Product.builder()
                .name(req.name())
                .slug(slug)
                .sku(req.sku())
                .category(category)
                .brand(brand)
                .basePrice(req.basePrice())
                .vatRate(req.vatRate() != null ? req.vatRate() : new BigDecimal("20.00"))
                .minSellingQuantity(req.minSellingQuantity() != null ? req.minSellingQuantity() : 1)
                .stockQuantity(req.stockQuantity() != null ? req.stockQuantity() : 0)
                .unit(req.unit() != null ? req.unit() : ProductMessages.DEFAULT_UNIT.get())
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
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get(), id));

        product.setName(req.name());
        product.setSlug(SlugUtil.toSlug(req.name()));
        product.setSku(req.sku());
        product.setBasePrice(req.basePrice());

        if (req.vatRate() != null) product.setVatRate(req.vatRate());
        if (req.minSellingQuantity() != null) product.setMinSellingQuantity(req.minSellingQuantity());
        if (req.stockQuantity() != null) product.setStockQuantity(req.stockQuantity());
        if (req.unit() != null) product.setUnit(req.unit());
        if (req.shortDescription() != null) product.setShortDescription(req.shortDescription());
        if (req.description() != null) product.setDescription(req.description());
        if (req.isActive() != null) product.setIsActive(req.isActive());
        if (req.isFeatured() != null) product.setIsFeatured(req.isFeatured());

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.CATEGORY_NOT_FOUND.get(), req.categoryId()));
        product.setCategory(category);

        Brand brand = null;
        if (req.brandId() != null) {
            brand = brandRepository.findById(req.brandId())
                    .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.BRAND_NOT_FOUND.get(), req.brandId()));
        }
        product.setBrand(brand);

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get(), id));
        productRepository.deleteById(id);
    }

    // ─── Discount helpers ─────────────────────────────────────────────────────

    private Page<ProductResponse> enrichPageWithImages(Page<Product> page, Pageable pageable) {
        if (page.isEmpty()) return Page.empty(pageable);
        List<Long> ids = page.getContent().stream().map(Product::getId).toList();
        Map<Long, Product> withImages = productRepository.findByIdsWithImages(ids)
                .stream().collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        List<ProductResponse> enriched = ids.stream()
                .map(id -> withImages.getOrDefault(id, page.getContent().stream().filter(p -> p.getId().equals(id)).findFirst().orElseThrow()))
                .map(p -> ProductResponse.fromWithDiscount(p, dm.get(p.getId())))
                .toList();
        return new PageImpl<>(enriched, pageable, page.getTotalElements());
    }

    /**
     * Tüm aktif indirimleri 3 sabit SQL ile yükler (N+1 yok).
     * Öncelik: ürün indirim > kategori indirim > marka indirim
     */
    private Map<Long, ProductResponse.ActiveDiscountDto> buildDiscountMap() {
        LocalDateTime now = LocalDateTime.now();
        Map<Long, ProductResponse.ActiveDiscountDto> map = new HashMap<>();

        // Marka indirimleri (en düşük öncelik)
        productRepository.findProductIdsWithBrandDiscounts(now)
                .forEach(row -> map.merge(
                        (Long) row[0],
                        toDto((String) row[1], ((ProductDiscount.DiscountType) row[2]).name(), (BigDecimal) row[3]),
                        this::better));

        // Kategori indirimleri
        productRepository.findProductIdsWithCategoryDiscounts(now)
                .forEach(row -> map.merge(
                        (Long) row[0],
                        toDto((String) row[1], ((ProductDiscount.DiscountType) row[2]).name(), (BigDecimal) row[3]),
                        this::better));

        // Ürün indirimleri (en yüksek öncelik — her zaman üzerine yazar)
        productRepository.findActiveProductDiscounts(now)
                .forEach(row -> map.put(
                        (Long) row[0],
                        toDto((String) row[1], ((ProductDiscount.DiscountType) row[2]).name(), (BigDecimal) row[3])));

        return map;
    }

    private ProductResponse.ActiveDiscountDto toDto(String name, String discountType, BigDecimal value) {
        String label = AppConstants.DISCOUNT_PERCENT.equals(discountType)
                ? "%" + value.stripTrailingZeros().toPlainString()
                : value.stripTrailingZeros().toPlainString() + " ₺";
        return new ProductResponse.ActiveDiscountDto(label, discountType, value, name);
    }

    private ProductResponse.ActiveDiscountDto better(ProductResponse.ActiveDiscountDto a, ProductResponse.ActiveDiscountDto b) {
        return a.discountValue().compareTo(b.discountValue()) >= 0 ? a : b;
    }

}
