package com.petshop.controller.admin;

import com.petshop.dto.response.GenericResponse;
import com.petshop.service.InvoiceOutboxService;
import com.petshop.service.RefundService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminRefundController {

    private final RefundService refundService;
    private final InvoiceOutboxService invoiceOutboxService;

    @PostMapping("/{id}/refund")
    public ResponseEntity<GenericResponse> refund(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest req) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        refundService.refund(id, reason, req.getRemoteAddr());
        return ResponseEntity.ok(GenericResponse.ok("Sipariş iade edildi"));
    }

    @PostMapping("/{id}/invoice/retry")
    public ResponseEntity<GenericResponse> retryInvoice(@PathVariable Long id) {
        invoiceOutboxService.retry(id);
        return ResponseEntity.ok(GenericResponse.ok("Fatura kuyruğa alındı"));
    }
}
