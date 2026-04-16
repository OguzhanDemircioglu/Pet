package com.petshop.controller;

import com.petshop.dto.request.OrderRequest;
import com.petshop.dto.response.OrderResponse;
import com.petshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Map<String, String>> createOrder(
            @AuthenticationPrincipal Long userId,
            @RequestBody OrderRequest request) {
        orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Sipariş alındı"));
    }

    @GetMapping("/myOrders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal Long userId) {
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }
}
