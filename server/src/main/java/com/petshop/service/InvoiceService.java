package com.petshop.service;

import com.petshop.config.ParasutProperties;
import com.petshop.entity.Order;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.OrderRepository;
import com.petshop.service.parasut.ParasutClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final OrderRepository orderRepository;
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

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if (order.getParasutInvoiceId() != null && !order.getParasutInvoiceId().isBlank()) {
            log.info("Sipariş #{} için fatura zaten var ({}), tekrar kesilmedi",
                    orderId, order.getParasutInvoiceId());
            return;
        }

        boolean corporate = order.getInvoiceType() == Order.InvoiceType.CORPORATE;

        String contactId = order.getParasutContactId();
        if (contactId == null || contactId.isBlank()) {
            contactId = parasutClient.createOrFindContact(order);
            order.setParasutContactId(contactId);
        }

        String invoiceId = parasutClient.createSalesInvoice(order, contactId);
        order.setParasutInvoiceId(invoiceId);

        parasutClient.createEDocument(invoiceId, corporate);

        order.setParasutInvoiceStatus(Order.ParasutInvoiceStatus.CREATED);
        String pdfUrl = parasutClient.getInvoicePdfUrl(invoiceId);
        if (pdfUrl != null) order.setParasutEBelgeUrl(pdfUrl);

        orderRepository.save(order);
        log.info("Fatura başarıyla kesildi — sipariş #{}, fatura {}", orderId, invoiceId);
    }

    @Transactional
    public void cancelInvoiceForOrder(Long orderId) {
        if (!parasutProps.enabled()) return;

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı: " + orderId));

        if (order.getParasutInvoiceId() == null || order.getParasutInvoiceId().isBlank()) {
            log.warn("Sipariş #{} için Paraşüt fatura ID yok, iptal atlandı", orderId);
            return;
        }

        parasutClient.cancelInvoice(order.getParasutInvoiceId());
        order.setParasutInvoiceStatus(Order.ParasutInvoiceStatus.CANCELLED);
        orderRepository.save(order);
    }
}
