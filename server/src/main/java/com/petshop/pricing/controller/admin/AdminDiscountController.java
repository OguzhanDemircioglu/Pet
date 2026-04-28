package com.petshop.pricing.controller.admin;

import com.petshop.pricing.dto.request.*;
import com.petshop.pricing.dto.response.CouponValidationResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.pricing.dto.response.DiscountResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.pricing.service.DiscountService;
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
    public ResponseEntity<DataGenericResponse<List<DiscountResponse>>> list() {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.getAllDiscounts()));
    }

    @PostMapping("/category")
    public ResponseEntity<DataGenericResponse<DiscountResponse>> createCategory(@Valid @RequestBody CategoryDiscountRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.createCategoryDiscount(req)));
    }

    @PostMapping("/product")
    public ResponseEntity<DataGenericResponse<DiscountResponse>> createProduct(@Valid @RequestBody ProductDiscountRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.createProductDiscount(req)));
    }

    @PostMapping("/brand")
    public ResponseEntity<DataGenericResponse<DiscountResponse>> createBrand(@Valid @RequestBody BrandDiscountRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.createBrandDiscount(req)));
    }

    @PostMapping("/general")
    public ResponseEntity<DataGenericResponse<DiscountResponse>> createGeneral(@Valid @RequestBody GeneralDiscountRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.createGeneralDiscount(req)));
    }

    @PutMapping("/{type}/{id}")
    public ResponseEntity<DataGenericResponse<DiscountResponse>> update(@PathVariable String type, @PathVariable Long id,
            @Valid @RequestBody DiscountUpdateRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.updateDiscount(type, id, req)));
    }

    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<GenericResponse> delete(@PathVariable String type, @PathVariable Long id) {
        discountService.deleteDiscount(type, id);
        return ResponseEntity.ok(GenericResponse.ok());
    }

    @GetMapping("/active-emojis")
    public ResponseEntity<DataGenericResponse<Set<String>>> activeEmojis() {
        return ResponseEntity.ok(DataGenericResponse.of(discountService.getActiveEmojis()));
    }

    @PostMapping("/validate-coupon")
    public ResponseEntity<DataGenericResponse<CouponValidationResponse>> validateCoupon(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("couponCode");
        BigDecimal amount = new BigDecimal(body.get("orderAmount").toString());
        return ResponseEntity.ok(DataGenericResponse.of(discountService.validateCoupon(code, amount)));
    }
}
