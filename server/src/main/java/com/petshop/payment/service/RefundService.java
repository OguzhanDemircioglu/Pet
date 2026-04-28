package com.petshop.payment.service;

import com.iyzipay.model.Payment;
import com.iyzipay.model.PaymentItem;
import com.iyzipay.model.Refund;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.invoice.api.InvoiceFacade;
import com.petshop.order.api.OrderFacade;
import com.petshop.order.api.OrderItemView;
import com.petshop.order.api.OrderView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

/**
 * İade (AIDE) süreci: iyzico refund → Paraşüt fatura iptali (outbox) → stok iadesi → Order.REFUNDED.
 * Yalnızca admin tetikler.
 *
 * Tüm cross-module erişimler facade üzerinden yapılır:
 *  - {@link OrderFacade}    sipariş okuma + state geçişi
 *  - {@link CatalogFacade}  stok iadesi
 *  - {@link InvoiceFacade}  Paraşüt fatura iptali (outbox enqueue)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private static final Set<String> REFUNDABLE_STATUSES =
            Set.of("PAID", "PROCESSING", "SHIPPED", "DELIVERED");

    private final OrderFacade orderFacade;
    private final CatalogFacade catalogFacade;
    private final InvoiceFacade invoiceFacade;
    private final IyzicoClient iyzicoClient;

    @Transactional
    public void refund(Long orderId, String reason, String adminIp) {
        OrderView order = orderFacade.findOrder(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if ("REFUNDED".equals(order.status())) {
            throw new BusinessException("Sipariş zaten iade edilmiş");
        }
        if (!REFUNDABLE_STATUSES.contains(order.status())) {
            throw new BusinessException("Bu sipariş durumu iade edilemez: " + order.status());
        }
        if (!"CREDIT_CARD".equals(order.paymentMethod())) {
            throw new BusinessException("Sadece kredi kartı ile ödenen siparişler iyzico'dan iade edilebilir");
        }

        // 1) iyzico payment detaylarını al → paymentTransactionId listesi
        String paymentId = order.iyzicoPaymentId();
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

        // 3) Stok iadesi (CatalogFacade üzerinden, variant öncelikli)
        for (OrderItemView oi : order.items()) {
            if (oi.productId() == null) continue;
            catalogFacade.restoreStock(oi.productId(), oi.variantId(), oi.quantity());
            // Aboneye stok bildirim event'i (notification modülü dinler)
            catalogFacade.fireStockBackIfSubscribed(oi.productId(), oi.variantId());
        }

        // 4) Sipariş durumu güncelle (OrderFacade.markRefunded içinden status + refundedAt + reason set edilir)
        orderFacade.markRefunded(orderId, reason);

        // 5) Paraşüt fatura iptali (async outbox, hata akışı bloklamasın)
        if (order.parasutInvoiceId() != null && !order.parasutInvoiceId().isBlank()) {
            invoiceFacade.enqueueCancel(orderId);
        }

        log.info("Sipariş #{} iade tamamlandı — sebep: {}", orderId, reason);
    }
}
