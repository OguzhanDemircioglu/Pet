package com.petshop.payment.controller;

import com.petshop.order.dto.request.OrderRequest;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.payment.dto.response.PaymentInitiateResponse;
import com.petshop.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Kredi kartı ödemesi başlatır.
     * Sipariş PENDING + CREDIT_CARD olarak kaydedilir, iyzico Checkout Form URL'i döner.
     */
    @PostMapping("/iyzico/initiate")
    public ResponseEntity<DataGenericResponse<PaymentInitiateResponse>> initiate(
            @AuthenticationPrincipal Long userId,
            @RequestBody OrderRequest req,
            HttpServletRequest httpReq) {

        String clientIp = getClientIp(httpReq);
        return ResponseEntity.ok(DataGenericResponse.of(paymentService.initiate(userId, req, clientIp)));
    }

    /**
     * iyzico'nun ödeme sonrası çağırdığı callback endpoint.
     * Ödeme sonucunu doğrular, sipariş durumunu günceller ve frontend'e yönlendirir.
     */
    @PostMapping("/iyzico/callback")
    public void callback(
            @RequestParam String token,
            HttpServletResponse response) throws IOException {

        String redirectUrl = paymentService.handleCallback(token);
        response.sendRedirect(redirectUrl);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
