package com.petshop.invoice.service;

import com.petshop.invoice.config.ParasutProperties;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.invoice.service.parasut.ParasutClient;
import com.petshop.order.api.OrderFacade;
import com.petshop.order.api.OrderView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final OrderFacade orderFacade;
    private final ParasutClient parasutClient;
    private final ParasutProperties parasutProps;

    /**
     * Siparişin faturasını keser (contact → invoice → e-belge).
     * Belge tipi kararı: invoiceType CORPORATE ise e-Fatura, değilse e-Arşiv.
     * Idempotent: parasutInvoiceId zaten varsa atlanır.
     */
    @Transactional
    public void issueInvoiceForOrder(Long orderId) {
        if (!parasutProps.enabled()) {
            log.debug("Paraşüt devre dışı — sipariş #{} fatura kesimi atlandı", orderId);
            return;
        }

        OrderView order = orderFacade.findOrder(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if (order.parasutInvoiceId() != null && !order.parasutInvoiceId().isBlank()) {
            log.info("Sipariş #{} için fatura zaten var ({}), tekrar kesilmedi",
                    orderId, order.parasutInvoiceId());
            return;
        }

        boolean corporate = "CORPORATE".equals(order.invoiceType());

        String contactId = order.parasutContactId();
        if (contactId == null || contactId.isBlank()) {
            contactId = parasutClient.createOrFindContact(order);
        }

        String invoiceId = parasutClient.createSalesInvoice(order, contactId);

        parasutClient.createEDocument(invoiceId, corporate);

        String pdfUrl = parasutClient.getInvoicePdfUrl(invoiceId);

        // Fatura metadata'sını order'a kaydet (cross-module mutator facade üzerinden)
        orderFacade.updateInvoiceMetadata(orderId, contactId, invoiceId, "CREATED",
                pdfUrl != null ? pdfUrl : order.parasutEBelgeUrl());

        log.info("Fatura başarıyla kesildi — sipariş #{}, fatura {}", orderId, invoiceId);
    }

    @Transactional
    public void cancelInvoiceForOrder(Long orderId) {
        if (!parasutProps.enabled()) return;

        OrderView order = orderFacade.findOrder(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if (order.parasutInvoiceId() == null || order.parasutInvoiceId().isBlank()) {
            log.warn("Sipariş #{} için Paraşüt fatura ID yok, iptal atlandı", orderId);
            return;
        }

        parasutClient.cancelInvoice(order.parasutInvoiceId());
        orderFacade.updateInvoiceMetadata(orderId, order.parasutContactId(),
                order.parasutInvoiceId(), "CANCELLED", order.parasutEBelgeUrl());
    }
}
