package com.petshop.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.FeaturedProductDto;
import com.petshop.dto.response.ProductResponse;
import com.petshop.service.ProductService;
import com.petshop.service.StockNotificationService;
import com.petshop.dto.response.GenericResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final StockNotificationService stockNotificationService;

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<ProductResponse>>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {

        Sort.Direction direction = dir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sort));

        Page<ProductResponse> result;
        if (q != null && !q.isBlank()) {
            result = productService.search(q, pageable);
        } else if (categoryId != null) {
            result = productService.listByCategory(categoryId, pageable);
        } else {
            result = productService.search("", pageable);
        }
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }

    @GetMapping("/featured")
    public ResponseEntity<DataGenericResponse<List<FeaturedProductDto>>> featured() {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getFeatured(20)));
    }

    @GetMapping("/deals")
    public ResponseEntity<DataGenericResponse<List<FeaturedProductDto>>> deals() {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getDeals(12)));
    }

    @GetMapping("/best-sellers")
    public ResponseEntity<DataGenericResponse<List<FeaturedProductDto>>> bestSellers() {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getBestSellers(12)));
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<DataGenericResponse<List<FeaturedProductDto>>> newArrivals() {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getNewArrivals(12)));
    }

    // ─── Stok bildirim aboneliği ──────────────────────────────────────────────

    public record StockNotifyRequest(@NotBlank @Email String email, Long variantId) {}

    @PostMapping("/{productId}/notify-stock")
    public ResponseEntity<GenericResponse> subscribeStockNotification(
            @PathVariable Long productId,
            @Valid @RequestBody StockNotifyRequest req) {
        stockNotificationService.subscribe(productId, req.variantId(), req.email());
        return ResponseEntity.ok(GenericResponse.ok("Stok geldiğinde e-posta ile bilgilendireceğiz."));
    }

    @GetMapping("/{productId}/notify-stock")
    public ResponseEntity<DataGenericResponse<Map<String, Boolean>>> checkStockNotification(
            @PathVariable Long productId,
            @RequestParam String email,
            @RequestParam(required = false) Long variantId) {
        boolean subscribed = stockNotificationService.isSubscribed(productId, variantId, email);
        return ResponseEntity.ok(DataGenericResponse.of(Map.of("subscribed", subscribed)));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<DataGenericResponse<ProductResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(DataGenericResponse.of(productService.getBySlug(slug)));
    }
}
