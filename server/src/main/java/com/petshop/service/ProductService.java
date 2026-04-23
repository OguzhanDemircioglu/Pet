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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductReviewRepository productReviewRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StockNotificationService stockNotificationService;

    // ─── Public listing ───────────────────────────────────────────────────────

    public Page<ProductResponse> listByCategory(Long categoryId, Pageable pageable) {
        return enrichPage(productRepository.findByCategoryPaged(categoryId, pageable), pageable);
    }

    public Page<ProductResponse> search(String query, Pageable pageable) {
        return enrichPage(productRepository.searchPaged(query, pageable), pageable);
    }

    public ProductResponse getBySlug(String slug) {
        Product p = productRepository.findBySlugWithDetails(slug)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get() + " bulunamadı: " + slug));
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        Double avg = productReviewRepository.findAverageRatingByProductId(p.getId());
        int cnt = (int) productReviewRepository.countByProductId(p.getId());
        // variants lazy-loaded within the open transaction
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
        return enrichFeatured(products);
    }

    public List<FeaturedProductDto> getDeals(int limit) {
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        if (dm.isEmpty()) return List.of();
        List<Long> ids = dm.keySet().stream().limit(Math.max(limit, 1)).toList();
        List<Product> products = productRepository.findByIdsWithImages(ids).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .toList();
        if (products.isEmpty()) return List.of();
        Map<Long, List<ProductVariant>> variantMap = buildVariantMap(products.stream().map(Product::getId).toList());
        return products.stream()
                .map(p -> toFeaturedDto(p, dm.get(p.getId()), variantMap.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    public List<FeaturedProductDto> getNewArrivals(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Product> products = productRepository.findNewArrivalsWithImages(since, PageRequest.of(0, limit));
        return enrichFeatured(products);
    }

    public List<FeaturedProductDto> getBestSellers(int limit) {
        List<com.petshop.entity.Order.OrderStatus> statuses = List.of(
                com.petshop.entity.Order.OrderStatus.PAID,
                com.petshop.entity.Order.OrderStatus.PROCESSING,
                com.petshop.entity.Order.OrderStatus.SHIPPED,
                com.petshop.entity.Order.OrderStatus.DELIVERED
        );
        List<Object[]> rows = productRepository.findBestSellerProductIds(statuses, PageRequest.of(0, limit));
        if (rows.isEmpty()) return List.of();
        List<Long> ids = rows.stream().map(r -> (Long) r[0]).toList();
        List<Product> products = productRepository.findByIdsWithImages(ids);
        // Sipariş adedine göre sıralamayı koru
        Map<Long, Product> byId = products.stream().collect(Collectors.toMap(Product::getId, p -> p));
        List<Product> ordered = ids.stream().map(byId::get).filter(Objects::nonNull).toList();
        return enrichFeatured(ordered);
    }

    private List<FeaturedProductDto> enrichFeatured(List<Product> products) {
        if (products.isEmpty()) return List.of();
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        Map<Long, List<ProductVariant>> variantMap = buildVariantMap(products.stream().map(Product::getId).toList());
        return products.stream().map(p -> toFeaturedDto(p, dm.get(p.getId()), variantMap.getOrDefault(p.getId(), List.of()))).toList();
    }

    public List<CatalogProductDto> getAllCatalog() {
        List<Product> all = productRepository.findAllActiveWithImages();
        if (all.isEmpty()) return List.of();
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();
        Map<Long, List<ProductVariant>> variantMap = buildVariantMap(all.stream().map(Product::getId).toList());
        return all.stream().map(p -> toCatalogDto(p, dm.get(p.getId()), variantMap.getOrDefault(p.getId(), List.of()))).toList();
    }

    public Page<ProductResponse> listAll(Pageable pageable) {
        return enrichPage(productRepository.findAll(pageable), pageable);
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

        int previousAvailable = product.getAvailableStock();

        product.setName(req.name());
        product.setSlug(SlugUtil.toSlug(req.name()));
        product.setSku(req.sku());
        product.setBasePrice(req.basePrice());

        if (req.vatRate() != null) product.setVatRate(req.vatRate());
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

        Product saved = productRepository.save(product);

        // 0 → pozitife geçtiyse bekleyen abonelere e-posta
        if (previousAvailable <= 0 && saved.getAvailableStock() > 0) {
            stockNotificationService.notifyProductRestocked(saved.getId());
        }

        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProductMessages.PRODUCT_NOT_FOUND.get(), id));
        productRepository.deleteById(id);
    }

    // ─── DTO builders ─────────────────────────────────────────────────────────

    private CatalogProductDto toCatalogDto(Product p, ProductResponse.ActiveDiscountDto disc,
                                            List<ProductVariant> variants) {
        String primaryImage = p.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        List<CatalogProductDto.ImageDto> images = p.getImages().stream()
                .map(i -> new CatalogProductDto.ImageDto(i.getId(), i.getImageUrl(), i.getIsPrimary(), i.getDisplayOrder()))
                .toList();

        CatalogProductDto.ActiveDiscountDto discDto = disc == null ? null :
                new CatalogProductDto.ActiveDiscountDto(disc.label(), disc.discountType(), disc.discountValue());

        List<CatalogProductDto.VariantDto> variantDtos = variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .map(v -> new CatalogProductDto.VariantDto(v.getId(), v.getLabel(), v.getPrice(), v.getAvailableStock(), v.getDisplayOrder(), v.getIsActive()))
                .toList();

        return new CatalogProductDto(
                p.getId(), p.getName(), p.getSlug(),
                p.getSku(),
                p.getShortDescription(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getCategory() != null ? p.getCategory().getSlug() : null,
                p.getBrand() != null ? p.getBrand().getId() : null,
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(), p.getVatRate(),
                p.getAvailableStock(), p.getUnit(),
                p.getIsActive(), p.getIsFeatured(),
                primaryImage, images, discDto, variantDtos
        );
    }

    private FeaturedProductDto toFeaturedDto(Product p, ProductResponse.ActiveDiscountDto disc,
                                              List<ProductVariant> variants) {
        String primaryImage = p.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        FeaturedProductDto.ActiveDiscountDto discDto = disc == null ? null :
                new FeaturedProductDto.ActiveDiscountDto(disc.label(), disc.discountType(), disc.discountValue());

        List<FeaturedProductDto.VariantDto> variantDtos = variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .map(v -> new FeaturedProductDto.VariantDto(v.getId(), v.getLabel(), v.getPrice(), v.getAvailableStock(), v.getDisplayOrder(), v.getIsActive()))
                .toList();

        return new FeaturedProductDto(
                p.getId(), p.getName(), p.getSlug(),
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getBasePrice(), p.getAvailableStock(),
                p.getUnit(), primaryImage, discDto, variantDtos
        );
    }

    // ─── Enrichment ───────────────────────────────────────────────────────────

    private Page<ProductResponse> enrichPage(Page<Product> page, Pageable pageable) {
        if (page.isEmpty()) return Page.empty(pageable);
        List<Long> ids = page.getContent().stream().map(Product::getId).toList();

        Map<Long, Product> withImages = productRepository.findByIdsWithImages(ids)
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<Long, List<ProductVariant>> variantMap = buildVariantMap(ids);
        Map<Long, ProductResponse.ActiveDiscountDto> dm = buildDiscountMap();

        List<ProductResponse> enriched = ids.stream()
                .map(id -> {
                    Product p = withImages.getOrDefault(id,
                            page.getContent().stream().filter(pr -> pr.getId().equals(id)).findFirst().orElseThrow());
                    List<ProductVariant> variants = variantMap.getOrDefault(id, List.of());
                    p.getVariants().clear();
                    p.getVariants().addAll(variants);
                    return ProductResponse.fromWithDiscount(p, dm.get(p.getId()));
                })
                .toList();
        return new PageImpl<>(enriched, pageable, page.getTotalElements());
    }

    /** Batch-load active variants for given product IDs — avoids N+1. */
    private Map<Long, List<ProductVariant>> buildVariantMap(List<Long> productIds) {
        if (productIds.isEmpty()) return Map.of();
        return productVariantRepository.findActiveByProductIds(productIds)
                .stream().collect(Collectors.groupingBy(v -> v.getProduct().getId()));
    }

    // ─── Discount helpers ─────────────────────────────────────────────────────

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
