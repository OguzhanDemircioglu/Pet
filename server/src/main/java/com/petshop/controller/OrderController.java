package com.petshop.controller;

import com.petshop.dto.request.OrderRequest;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.dto.response.OrderResponse;
import com.petshop.constant.ResponseMessages;
import com.petshop.entity.Order;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.OrderRepository;
import com.petshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    @PostMapping
    public ResponseEntity<GenericResponse> createOrder(
            @AuthenticationPrincipal Long userId,
            @RequestBody OrderRequest request) {
        orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(GenericResponse.ok(ResponseMessages.ORDER_CREATED.get()));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<Void> getInvoicePdf(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + id));
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new BusinessException("Bu siparişe erişim yetkiniz yok");
        }
        String url = order.getParasutEBelgeUrl();
        if (url == null || url.isBlank()) {
            throw new BusinessException("Fatura henüz hazır değil");
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", url)
                .build();
    }

    @GetMapping("/myOrders")
    public ResponseEntity<DataGenericResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(DataGenericResponse.of(orderService.getUserOrders(userId)));
    }
}
