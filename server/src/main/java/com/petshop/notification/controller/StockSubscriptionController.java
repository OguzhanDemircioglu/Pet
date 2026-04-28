package com.petshop.notification.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.notification.api.NotificationFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Stok bildirim aboneliği — tükenen ürünler için "stoğa gelince haber ver" akışı.
 *
 * Daha önce catalog/ProductController içindeydi; modüler sınırları korumak için
 * notification modülüne taşındı. URL aynı: /products/{productId}/notify-stock
 */
@RestController
@RequestMapping("/products/{productId}/notify-stock")
@RequiredArgsConstructor
public class StockSubscriptionController {

    private final NotificationFacade notificationFacade;

    public record StockNotifyRequest(@NotBlank @Email String email, Long variantId) {}

    @PostMapping
    public ResponseEntity<GenericResponse> subscribe(
            @PathVariable Long productId,
            @Valid @RequestBody StockNotifyRequest req) {
        notificationFacade.subscribeToStock(productId, req.variantId(), req.email());
        return ResponseEntity.ok(GenericResponse.ok("Stok geldiğinde e-posta ile bilgilendireceğiz."));
    }

    @GetMapping
    public ResponseEntity<DataGenericResponse<Map<String, Boolean>>> check(
            @PathVariable Long productId,
            @RequestParam String email,
            @RequestParam(required = false) Long variantId) {
        boolean subscribed = notificationFacade.isStockSubscribed(productId, variantId, email);
        return ResponseEntity.ok(DataGenericResponse.of(Map.of("subscribed", subscribed)));
    }
}
