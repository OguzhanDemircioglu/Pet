package com.petshop.service;

import com.iyzipay.model.Payment;
import com.iyzipay.model.PaymentItem;
import com.iyzipay.model.Refund;
import com.petshop.entity.Order;
import com.petshop.entity.OrderItem;
import com.petshop.entity.Product;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.OrderRepository;
import com.petshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * İade (AIDE) süreci: iyzico refund → Paraşüt fatura iptali (outbox) → stok iadesi → Order.REFUNDED.
 * Yalnızca admin tetikler.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final IyzicoClient iyzicoClient;
    private final InvoiceOutboxService invoiceOutboxService;

    @Transactional
    public void refund(Long orderId, String reason, String adminIp) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if (order.getStatus() == Order.OrderStatus.REFUNDED) {
            throw new BusinessException("Sipariş zaten iade edilmiş");
        }
        if (order.getStatus() != Order.OrderStatus.PAID
                && order.getStatus() != Order.OrderStatus.PROCESSING
                && order.getStatus() != Order.OrderStatus.SHIPPED
                && order.getStatus() != Order.OrderStatus.DELIVERED) {
            throw new BusinessException("Bu sipariş durumu iade edilemez: " + order.getStatus());
        }
        if (order.getPaymentMethod() != Order.PaymentMethod.CREDIT_CARD) {
            throw new BusinessException("Sadece kredi kartı ile ödenen siparişler iyzico'dan iade edilebilir");
        }

        // 1) iyzico payment detaylarını al → paymentTransactionId listesi
        String paymentId = order.getIyzicoPaymentId();
        if (paymentId == null || paymentId.isBlank()) {
            throw new BusinessException("iyzico payment ID bulunamadı — manuel iade gerekli");
        }

        Payment payment = iyzicoClient.retrievePayment(paymentId);
        if (payment == null || !"success".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("iyzico payment alınamadı: "
                    + (payment != null ? payment.getErrorMessage() : "null"));
        }

        // 2) Her item için refund çağır
        for (PaymentItem item : payment.getPaymentItems()) {
            BigDecimal price = item.getPaidPrice().setScale(2, RoundingMode.HALF_UP);
            Refund r = iyzicoClient.refundTransaction(item.getPaymentTransactionId(), price, adminIp);
            if (!"success".equalsIgnoreCase(r.getStatus())) {
                throw new BusinessException("iyzico iade başarısız (txn " + item.getPaymentTransactionId()
                        + "): [" + r.getErrorCode() + "] " + r.getErrorMessage());
            }
            log.info("iyzico iade OK — sipariş #{}, txn {}, tutar {}",
                    orderId, item.getPaymentTransactionId(), price);
        }

        // 3) Stok iadesi
        for (OrderItem oi : order.getItems()) {
            if (oi.getProduct() == null) continue;
            Product p = productRepository.findById(oi.getProduct().getId()).orElse(null);
            if (p == null) continue;
            p.setStockQuantity(p.getStockQuantity() + oi.getQuantity());
            productRepository.save(p);
        }

        // 4) Sipariş durumu güncelle
        order.setStatus(Order.OrderStatus.REFUNDED);
        order.setRefundedAt(LocalDateTime.now());
        order.setRefundReason(reason);
        orderRepository.save(order);

        // 5) Paraşüt fatura iptali (async, hata ödemeyi etkilemesin)
        if (order.getParasutInvoiceId() != null && !order.getParasutInvoiceId().isBlank()) {
            invoiceOutboxService.enqueueCancel(order);
        }

        log.info("Sipariş #{} iade tamamlandı — sebep: {}", orderId, reason);
    }
}
