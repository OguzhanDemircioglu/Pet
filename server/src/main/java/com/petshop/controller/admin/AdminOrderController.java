package com.petshop.controller.admin;

import com.petshop.dto.response.OrderResponse;
import com.petshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<OrderResponse> approveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.approveOrder(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<OrderResponse> rejectOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.rejectOrder(id));
    }
}
