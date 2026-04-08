package com.petshop.controller.admin;

import com.petshop.dto.request.*;
import com.petshop.dto.response.CouponValidationResponse;
import com.petshop.dto.response.DiscountResponse;
import com.petshop.service.DiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/admin/discounts")
@RequiredArgsConstructor
public class AdminDiscountController {

    private final DiscountService discountService;

    @GetMapping
    public ResponseEntity<List<DiscountResponse>> list() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @PostMapping("/category")
    public ResponseEntity<DiscountResponse> createCategory(@Valid @RequestBody CategoryDiscountRequest req) {
        return ResponseEntity.ok(discountService.createCategoryDiscount(req));
    }

    @PostMapping("/product")
    public ResponseEntity<DiscountResponse> createProduct(@Valid @RequestBody ProductDiscountRequest req) {
        return ResponseEntity.ok(discountService.createProductDiscount(req));
    }

    @PostMapping("/brand")
    public ResponseEntity<DiscountResponse> createBrand(@Valid @RequestBody BrandDiscountRequest req) {
        return ResponseEntity.ok(discountService.createBrandDiscount(req));
    }

    @PostMapping("/general")
    public ResponseEntity<DiscountResponse> createGeneral(@Valid @RequestBody GeneralDiscountRequest req) {
        return ResponseEntity.ok(discountService.createGeneralDiscount(req));
    }

    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String type, @PathVariable Long id) {
        discountService.deleteDiscount(type, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active-emojis")
    public ResponseEntity<Set<String>> activeEmojis() {
        return ResponseEntity.ok(discountService.getActiveEmojis());
    }

    @PostMapping("/validate-coupon")
    public ResponseEntity<CouponValidationResponse> validateCoupon(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("couponCode");
        BigDecimal amount = new BigDecimal(body.get("orderAmount").toString());
        return ResponseEntity.ok(discountService.validateCoupon(code, amount));
    }
}
