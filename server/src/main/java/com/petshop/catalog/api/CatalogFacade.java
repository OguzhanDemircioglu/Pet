package com.petshop.catalog.api;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/**
 * Public API of the catalog module. Consumers must depend only on this interface
 * and the DTOs in {@code com.petshop.catalog.api}.
 */
public interface CatalogFacade {

    Optional<ProductSummary> findProduct(Long productId);

    Optional<ProductSummary> findProductBySlug(String slug);

    Map<Long, ProductSummary> findProducts(Collection<Long> productIds);

    Optional<VariantSummary> findVariant(Long variantId);

    Map<Long, VariantSummary> findVariants(Collection<Long> variantIds);

    /**
     * Verify that {@code qty} units are available for the given productId / variantId.
     * If variantId is null, checks product-level stock.
     *
     * @throws StockInsufficientException if not enough stock.
     */
    void assertAvailable(Long productId, Long variantId, int qty);

    /**
     * Decrement stock. Variant-level if variantId non-null; otherwise product-level.
     * No-op if entity missing. Throws {@link StockInsufficientException} if not enough stock.
     */
    void decrementStock(Long productId, Long variantId, int qty);

    /**
     * Restore (add back) stock — used on cancellation / refund.
     * No-op if entity missing.
     */
    void restoreStock(Long productId, Long variantId, int qty);

    /**
     * Notify the catalog module that stock for (productId, variantId) may have increased —
     * triggers "back in stock" subscriber emails.
     */
    void fireStockBackIfSubscribed(Long productId, Long variantId);

    Optional<String> findCategoryName(Long categoryId);

    Optional<String> findBrandName(Long brandId);

    Map<Long, String> findCategoryNames(Collection<Long> ids);

    Map<Long, String> findBrandNames(Collection<Long> ids);

    // ─── Public read API (used by PublicController etc.) ───────────────────
    java.util.List<com.petshop.catalog.dto.response.CatalogProductDto> getAllCatalog();

    java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getFeatured(int limit);

    java.util.List<com.petshop.catalog.dto.response.CategoryFlatResponse> getAllFlatCategories();

    /**
     * Review modülü tarafından çağrılır — review eklenince/silinince ürünün
     * snapshot rating verisi (avg + count) güncellenir.
     */
    void updateProductRating(Long productId, java.math.BigDecimal avgRating, Integer reviewCount);

    /** Best-seller composer için: ID listesi sırasını koruyarak FeaturedProductDto'ya dönüştür. */
    java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getFeaturedByIds(java.util.List<Long> productIds);

    /** Aktif indirimi olan ürünler — anasayfa "Fırsatlar" bölümü için. */
    java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getDeals(int limit);

    /** Son 30 günde eklenen ürünler — anasayfa "Yeni Gelenler" bölümü için. */
    java.util.List<com.petshop.catalog.dto.response.FeaturedProductDto> getNewArrivals(int limit);
}
