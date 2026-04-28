package com.petshop.catalog.dto.response;

import java.util.List;

/**
 * Anasayfa preload bundle'ı. Tek HTTP request'te 4 farklı ürün listesi yüklenir,
 * frontend ana sayfada paralel render eder.
 *
 * <p>Üretim: {@code com.petshop.web.PublicController#homepage()} bu listeleri
 * CatalogFacade + OrderFacade composition'ı ile doldurur.
 */
public record HomepageResponse(
        List<FeaturedProductDto> featured,
        List<FeaturedProductDto> bestSellers,
        List<FeaturedProductDto> newArrivals,
        List<FeaturedProductDto> deals
) {}
