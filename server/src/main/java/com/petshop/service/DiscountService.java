package com.petshop.service;

import com.petshop.dto.request.*;
import com.petshop.dto.response.CampaignResponse;
import com.petshop.dto.response.CouponValidationResponse;
import com.petshop.dto.response.DiscountResponse;
import com.petshop.entity.*;
import com.petshop.constant.AppConstants;
import com.petshop.constant.DiscountMessages;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscountService {

    private final CategoryDiscountRepository categoryDiscountRepo;
    private final ProductDiscountRepository productDiscountRepo;
    private final BrandDiscountRepository brandDiscountRepo;
    private final GeneralDiscountRepository generalDiscountRepo;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;

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
        Category cat = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", req.categoryId()));
        CategoryDiscount d = new CategoryDiscount();
        d.setCategory(cat);
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
        Product p = productRepository.findById(req.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", req.productId()));
        ProductDiscount d = new ProductDiscount();
        d.setProduct(p);
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
        Brand b = brandRepository.findById(req.brandId())
                .orElseThrow(() -> new ResourceNotFoundException("Marka", req.brandId()));
        BrandDiscount d = BrandDiscount.builder()
                .brand(b)
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

        categoryDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> slides.add(discountToSlide(
                        d.getId(), d.getName(), d.getEmoji(),
                        d.getDiscountType().name(), d.getDiscountValue(),
                        d.getCategory().getName(), "linear-gradient(135deg,#0f766e,#064e3b)")));

        productDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> slides.add(discountToSlide(
                        d.getId(), d.getName(), d.getEmoji(),
                        d.getDiscountType().name(), d.getDiscountValue(),
                        d.getProduct().getName(), "linear-gradient(135deg,#7c3aed,#4c1d95)")));

        brandDiscountRepo.findAll().stream()
                .filter(d -> isCurrentlyActive(d.getIsActive(), d.getStartDate(), d.getEndDate(), now))
                .forEach(d -> slides.add(discountToSlide(
                        d.getId(), d.getName(), d.getEmoji(),
                        d.getDiscountType().name(), d.getDiscountValue(),
                        d.getBrand().getName(), "linear-gradient(135deg,#0369a1,#0c4a6e)")));

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
        if (!Boolean.TRUE.equals(active)) return false;
        if (start != null && now.isBefore(start)) return false;
        if (end != null && now.isAfter(end)) return false;
        return true;
    }

    public Set<String> getActiveEmojis() {
        Set<String> emojis = new HashSet<>();
        emojis.addAll(categoryDiscountRepo.findActiveEmojis());
        emojis.addAll(productDiscountRepo.findActiveEmojis());
        emojis.addAll(brandDiscountRepo.findActiveEmojis());
        emojis.addAll(generalDiscountRepo.findActiveEmojis());
        return emojis;
    }

    public CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount) {
        return generalDiscountRepo.findByCouponCodeIgnoreCase(code)
                .filter(d -> d.getIsActive())
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

    // --- toResponse helpers ---

    private DiscountResponse toResponse(CategoryDiscount d) {
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_CATEGORY.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                d.getCategory().getName(), d.getCategory().getId(),
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                null, null, null, null);
    }

    private DiscountResponse toResponse(ProductDiscount d) {
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_PRODUCT.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                d.getProduct().getName(), d.getProduct().getId(),
                d.getStartDate(), d.getEndDate(), d.getIsActive(), d.getCreatedAt(),
                null, null, null, null);
    }

    private DiscountResponse toResponse(BrandDiscount d) {
        return new DiscountResponse(
                d.getId(), DiscountMessages.TYPE_BRAND.get(), d.getName(), d.getEmoji(),
                d.getDiscountType().name(), d.getDiscountValue(),
                d.getBrand().getName(), d.getBrand().getId(),
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
