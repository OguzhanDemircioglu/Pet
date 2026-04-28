package com.petshop.pricing.service;

import com.petshop.pricing.dto.request.*;
import com.petshop.pricing.dto.response.CouponValidationResponse;
import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.pricing.entity.BrandDiscount;
import com.petshop.pricing.entity.CategoryDiscount;
import com.petshop.pricing.entity.GeneralDiscount;
import com.petshop.pricing.entity.ProductDiscount;
import com.petshop.pricing.repository.BrandDiscountRepository;
import com.petshop.pricing.repository.CategoryDiscountRepository;
import com.petshop.pricing.repository.GeneralDiscountRepository;
import com.petshop.pricing.repository.ProductDiscountRepository;
import com.petshop.siteadmin.dto.response.CampaignResponse;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.constant.AppConstants;
import com.petshop.pricing.constant.DiscountMessages;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscountService {

    private final CategoryDiscountRepository categoryDiscountRepo;
    private final ProductDiscountRepository productDiscountRepo;
    private final BrandDiscountRepository brandDiscountRepo;
    private final GeneralDiscountRepository generalDiscountRepo;
    private final CatalogFacade catalogFacade;

    public List<DiscountResponse> getAllDiscounts() {
        List<DiscountResponse> result = new ArrayList<>();
        categoryDiscountRepo.findAll().forEach(d -> result.add(toResponse(d)));
        productDiscountRepo.findAll().forEach(d -> result.add(toResponse(d)));
        brandDiscountRepo.findAll().forEach(d -> result.add(toResponse(d)));
        generalDiscountRepo.findAll().forEach(d -> result.add(toResponse(d)));
        result.sort(Comparator.comparing(DiscountResponse::createdAt).reversed());
        return result;
    }

    @Transactional
    public DiscountResponse createCategoryDiscount(CategoryDiscountRequest req) {
        if (catalogFacade.findCategoryName(req.categoryId()).isEmpty())
            throw new ResourceNotFoundException("Kategori", req.categoryId());
        CategoryDiscount d = new CategoryDiscount();
        d.setCategoryId(req.categoryId());
        d.setName(req.name());
        d.setEmoji(req.emoji());
        d.setDiscountType(req.discountType());
        d.setDiscountValue(req.discountValue());
        d.setStartDate(req.startDate());
        d.setEndDate(req.endDate());
        d.setIsActive(req.isActive() != null ? req.isActive() : true);
        return toResponse(categoryDiscountRepo.save(d));
    }

    @Transactional
    public DiscountResponse createProductDiscount(ProductDiscountRequest req) {
        if (catalogFacade.findProduct(req.productId()).isEmpty())
            throw new ResourceNotFoundException("Ürün", req.productId());
        ProductDiscount d = new ProductDiscount();
        d.setProductId(req.productId());
        d.setName(req.name());
        d.setEmoji(req.emoji());
        d.setDiscountType(req.discountType());
        d.setDiscountValue(req.discountValue());
        d.setStartDate(req.startDate());
        d.setEndDate(req.endDate());
        d.setIsActive(req.isActive() != null ? req.isActive() : true);
        return toResponse(productDiscountRepo.save(d));
    }

    @Transactional
    public DiscountResponse createBrandDiscount(BrandDiscountRequest req) {
        if (catalogFacade.findBrandName(req.brandId()).isEmpty())
            throw new ResourceNotFoundException("Marka", req.brandId());
        BrandDiscount d = BrandDiscount.builder()
                .brandId(req.brandId())
                .name(req.name())
                .emoji(req.emoji())
                .discountType(req.discountType())
                .discountValue(req.discountValue())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build();
        return toResponse(brandDiscountRepo.save(d));
    }

    @Transactional
    public DiscountResponse createGeneralDiscount(GeneralDiscountRequest req) {
        GeneralDiscount d = new GeneralDiscount();
        d.setName(req.name());
        d.setCouponCode(req.couponCode());
        d.setEmoji(req.emoji());
        d.setDiscountType(req.discountType());
        d.setDiscountValue(req.discountValue());
        d.setMinOrderAmount(req.minOrderAmount());
        d.setUsageLimit(req.usageLimit());
        d.setUsageCount(0);
        d.setStartDate(req.startDate());
        d.setEndDate(req.endDate());
        d.setIsActive(req.isActive() != null ? req.isActive() : true);
        return toResponse(generalDiscountRepo.save(d));
    }

    @Transactional
    public void deleteDiscount(String type, Long id) {
        switch (type) {
            case "category" -> {
                if (!categoryDiscountRepo.existsById(id)) throw new ResourceNotFoundException("İndirim", id);
                categoryDiscountRepo.deleteById(id);
            }
            case "product" -> {
                if (!productDiscountRepo.existsById(id)) throw new ResourceNotFoundException("İndirim", id);
                productDiscountRepo.deleteById(id);
            }
            case "brand" -> {
                if (!brandDiscountRepo.existsById(id)) throw new ResourceNotFoundException("İndirim", id);
                brandDiscountRepo.deleteById(id);
            }
            case "general" -> {
                if (!generalDiscountRepo.existsById(id)) throw new ResourceNotFoundException("İndirim", id);
                generalDiscountRepo.deleteById(id);
            }
            default -> throw new BusinessException(DiscountMessages.INVALID_TYPE.get() + type);
        }
    }

    /** Şu an aktif olan tüm indirimleri döndürür (public endpoint için). */
    public List<DiscountResponse> getActiveDiscounts() {
        LocalDateTime now = LocalDateTime.now();
        List<DiscountResponse> result = new ArrayList<>();
        categoryDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> result.add(toResponse(d)));
        productDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> result.add(toResponse(d)));
        brandDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> result.add(toResponse(d)));
        return result;
    }

    /** Aktif indirimleri carousel slide formatına dönüştürür. */
    public List<CampaignResponse> getActiveDiscountsAsSlides() {
        LocalDateTime now = LocalDateTime.now();
        List<CampaignResponse> slides = new ArrayList<>();

        // Active discount entity'lerini topla
        List<CategoryDiscount> activeCats = categoryDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now)).toList();
        List<ProductDiscount> activeProds = productDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now)).toList();
        List<BrandDiscount> activeBrands = brandDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now)).toList();

        // Cross-module ad lookup'ları (batch'li, facade üzerinden)
        Map<Long, String> catNames = catalogFacade.findCategoryNames(
                activeCats.stream().map(CategoryDiscount::getCategoryId).collect(Collectors.toSet()));
        Map<Long, String> prodNames = catalogFacade.findProducts(
                        activeProds.stream().map(ProductDiscount::getProductId).collect(Collectors.toSet()))
                .entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().name()));
        Map<Long, String> brandNames = catalogFacade.findBrandNames(
                activeBrands.stream().map(BrandDiscount::getBrandId).collect(Collectors.toSet()));

        activeCats.forEach(d -> slides.add(discountToSlide(
                d.getId(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                catNames.getOrDefault(d.getCategoryId(), ""), "linear-gradient(135deg,#0f766e,#064e3b)")));

        activeProds.forEach(d -> slides.add(discountToSlide(
                d.getId(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                prodNames.getOrDefault(d.getProductId(), ""), "linear-gradient(135deg,#7c3aed,#4c1d95)")));

        activeBrands.forEach(d -> slides.add(discountToSlide(
                d.getId(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                brandNames.getOrDefault(d.getBrandId(), ""), "linear-gradient(135deg,#0369a1,#0c4a6e)")));

        return slides;
    }

    @Transactional
    public DiscountResponse updateDiscount(String type, Long id, DiscountUpdateRequest req) {
        switch (type) {
            case "category" -> {
                CategoryDiscount d = categoryDiscountRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("İndirim", id));
                d.setName(req.name()); d.setEmoji(req.emoji());
                d.setDiscountType(req.discountType()); d.setDiscountValue(req.discountValue());
                d.setStartDate(req.startDate()); d.setEndDate(req.endDate());
                if (req.isActive() != null) d.setIsActive(req.isActive());
                return toResponse(categoryDiscountRepo.save(d));
            }
            case "product" -> {
                ProductDiscount d = productDiscountRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("İndirim", id));
                d.setName(req.name()); d.setEmoji(req.emoji());
                d.setDiscountType(req.discountType()); d.setDiscountValue(req.discountValue());
                d.setStartDate(req.startDate()); d.setEndDate(req.endDate());
                if (req.isActive() != null) d.setIsActive(req.isActive());
                return toResponse(productDiscountRepo.save(d));
            }
            case "brand" -> {
                BrandDiscount d = brandDiscountRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("İndirim", id));
                d.setName(req.name()); d.setEmoji(req.emoji());
                d.setDiscountType(req.discountType()); d.setDiscountValue(req.discountValue());
                d.setStartDate(req.startDate()); d.setEndDate(req.endDate());
                if (req.isActive() != null) d.setIsActive(req.isActive());
                return toResponse(brandDiscountRepo.save(d));
            }
            default -> throw new BusinessException(DiscountMessages.INVALID_TYPE.get() + type);
        }
    }

    private CampaignResponse discountToSlide(Long id, String name, String emoji,
            String discountType, BigDecimal discountValue, String targetName, String bgColor) {
        String valueLabel = AppConstants.DISCOUNT_PERCENT.equals(discountType)
                ? "%" + discountValue.stripTrailingZeros().toPlainString()
                : discountValue.stripTrailingZeros().toPlainString() + " ₺";
        String usedEmoji = (emoji != null && !emoji.isBlank()) ? emoji : "🏷️";
        String title = targetName + "'de\n" + valueLabel + " İndirim";
        String badge = usedEmoji + " " + valueLabel;
        return CampaignResponse.discount(title, badge, name, usedEmoji, bgColor);
    }

    private boolean isCurrentlyActive(Boolean active, LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        return Boolean.TRUE.equals(active)
                && (start == null || !now.isBefore(start))
                && (end == null || !now.isAfter(end));
    }

    public Set<String> getActiveEmojis() {
        return Stream.of(
                categoryDiscountRepo.findActiveEmojis(),
                productDiscountRepo.findActiveEmojis(),
                brandDiscountRepo.findActiveEmojis(),
                generalDiscountRepo.findActiveEmojis()
        ).flatMap(Collection::stream).collect(Collectors.toSet());
    }

    public CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount) {
        return generalDiscountRepo.findByCouponCodeIgnoreCase(code)
                .filter(GeneralDiscount::getIsActive)
                .filter(d -> d.getStartDate() == null || d.getStartDate().isBefore(LocalDateTime.now()))
                .filter(d -> d.getEndDate() == null || d.getEndDate().isAfter(LocalDateTime.now()))
                .filter(d -> d.getUsageLimit() == null || d.getUsageCount() < d.getUsageLimit())
                .filter(d -> d.getMinOrderAmount() == null || orderAmount.compareTo(d.getMinOrderAmount()) >= 0)
                .map(d -> {
                    BigDecimal discount = d.getDiscountType() == ProductDiscount.DiscountType.PERCENT
                            ? orderAmount.multiply(d.getDiscountValue()).divide(BigDecimal.valueOf(100))
                            : d.getDiscountValue();
                    return new CouponValidationResponse(true, DiscountMessages.COUPON_VALID.get(), discount, d.getDiscountType().name(), d.getCouponCode());
                })
                .orElse(new CouponValidationResponse(false, DiscountMessages.COUPON_INVALID.get(), BigDecimal.ZERO, null, code));
    }

    // --- toResponse helpers (cross-module name lookups via CatalogFacade) ---

    private DiscountResponse toResponse(CategoryDiscount d) {
        String name = catalogFacade.findCategoryName(d.getCategoryId()).orElse("");
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_CATEGORY.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                name, d.getCategoryId(),
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                null, null, null, null);
    }

    private DiscountResponse toResponse(ProductDiscount d) {
        String name = catalogFacade.findProduct(d.getProductId())
                .map(com.petshop.catalog.api.ProductSummary::name).orElse("");
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_PRODUCT.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                name, d.getProductId(),
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                null, null, null, null);
    }

    private DiscountResponse toResponse(BrandDiscount d) {
        String name = catalogFacade.findBrandName(d.getBrandId()).orElse("");
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_BRAND.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                name, d.getBrandId(),
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                null, null, null, null);
    }

    private DiscountResponse toResponse(GeneralDiscount d) {
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_GENERAL.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                d.getCouponCode(), null,
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                d.getCouponCode(), d.getMinOrderAmount(), d.getUsageLimit(), d.getUsageCount());
    }
}
