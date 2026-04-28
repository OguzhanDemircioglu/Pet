package com.petshop.invoice.service;

import com.petshop.invoice.constant.InvoiceSchedulerConstants;
import com.petshop.invoice.entity.InvoiceOutbox;
import com.petshop.invoice.repository.InvoiceOutboxRepository;
import com.petshop.order.api.OrderFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Fatura kesim (ve iptal) işlemlerini async retry pattern ile yönetir.
 * Ödeme callback'ini blokamaz — Paraşüt down olsa bile müşteri etkilenmez.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceOutboxService {

    private final InvoiceOutboxRepository outboxRepository;
    private final OrderFacade orderFacade;
    private final InvoiceService invoiceService;
    private final ApplicationContext ctx;

    /** Ödeme başarılı olduğunda çağrılır. Idempotent (order_id unique). */
    @Transactional
    public void enqueueIssue(Long orderId) {
        if (outboxRepository.findByOrderId(orderId).isPresent()) {
            log.debug("Outbox kaydı zaten var — sipariş #{}", orderId);
            return;
        }
        // Order'ın parasut durumunu PENDING'e çek (facade ile)
        orderFacade.findOrder(orderId).ifPresent(o ->
                orderFacade.updateInvoiceMetadata(orderId,
                        o.parasutContactId(), o.parasutInvoiceId(), "PENDING", o.parasutEBelgeUrl()));

        InvoiceOutbox rec = InvoiceOutbox.builder()
                .orderId(orderId)
                .status(InvoiceOutbox.Status.PENDING)
                .operation(InvoiceOutbox.Operation.ISSUE)
                .nextRetryAt(LocalDateTime.now())
                .build();
        outboxRepository.save(rec);
        log.info("Fatura outbox'a eklendi — sipariş #{}", orderId);
    }

    /** İade sonrası fatura iptali için. */
    @Transactional
    public void enqueueCancel(Long orderId) {
        InvoiceOutbox existing = outboxRepository.findByOrderId(orderId).orElse(null);
        if (existing != null && existing.getOperation() == InvoiceOutbox.Operation.CANCEL
                && existing.getStatus() != InvoiceOutbox.Status.FAILED) {
            return;
        }
        if (existing != null) outboxRepository.delete(existing);

        InvoiceOutbox rec = InvoiceOutbox.builder()
                .orderId(orderId)
                .status(InvoiceOutbox.Status.PENDING)
                .operation(InvoiceOutbox.Operation.CANCEL)
                .nextRetryAt(LocalDateTime.now())
                .build();
        outboxRepository.save(rec);
    }

    /** Admin paneli: FAILED olan kaydı tekrar PENDING'e alır. */
    @Transactional
    public void retry(Long orderId) {
        InvoiceOutbox rec = outboxRepository.findByOrderId(orderId).orElseThrow();
        rec.setStatus(InvoiceOutbox.Status.PENDING);
        rec.setAttemptCount(0);
        rec.setNextRetryAt(LocalDateTime.now());
        rec.setLastError(null);
        outboxRepository.save(rec);
    }

    // ─── Scheduled processor ─────────────────────────────────────────────

    @Scheduled(fixedDelay = InvoiceSchedulerConstants.INVOICE_OUTBOX_DELAY_MS)
    public void processOutbox() {
        List<InvoiceOutbox> pending = outboxRepository.findByStatusAndNextRetryAtBefore(
                InvoiceOutbox.Status.PENDING, LocalDateTime.now());

        if (pending.isEmpty()) return;
        log.debug("Fatura outbox: {} pending kayıt işleniyor", pending.size());

        // Self-invocation için proxy
        InvoiceOutboxService self = ctx.getBean(InvoiceOutboxService.class);
        for (InvoiceOutbox rec : pending) {
            try {
                self.processOne(rec.getId());
            } catch (Exception e) {
                log.error("Outbox kayıt #{} işlenirken hata: {}", rec.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void processOne(Long recordId) {
        InvoiceOutbox rec = outboxRepository.findById(recordId).orElse(null);
        if (rec == null || rec.getStatus() != InvoiceOutbox.Status.PENDING) return;

        Long orderId = rec.getOrderId();
        try {
            if (rec.getOperation() == InvoiceOutbox.Operation.ISSUE) {
                invoiceService.issueInvoiceForOrder(orderId);
            } else {
                invoiceService.cancelInvoiceForOrder(orderId);
            }
            rec.setStatus(InvoiceOutbox.Status.SUCCESS);
            rec.setProcessedAt(LocalDateTime.now());
            rec.setLastError(null);
            outboxRepository.save(rec);
            log.info("Outbox başarılı — {} sipariş #{}", rec.getOperation(), orderId);
        } catch (Exception e) {
            int attempt = rec.getAttemptCount() + 1;
            rec.setAttemptCount(attempt);
            rec.setLastError(truncate(e.getMessage(), 990));

            if (attempt >= InvoiceSchedulerConstants.OUTBOX_MAX_ATTEMPTS) {
                rec.setStatus(InvoiceOutbox.Status.FAILED);
                orderFacade.findOrder(orderId).ifPresent(o ->
                        orderFacade.updateInvoiceMetadata(orderId,
                                o.parasutContactId(), o.parasutInvoiceId(), "FAILED", o.parasutEBelgeUrl()));
                log.error("Outbox KALICI HATA — sipariş #{}: {}", orderId, e.getMessage());
            } else {
                // Exponential backoff: 1, 5, 15 dakika
                long delayMin = (long) Math.pow(5, attempt - 1);
                rec.setNextRetryAt(LocalDateTime.now().plusMinutes(delayMin));
                log.warn("Outbox retry {} — sipariş #{}, {} dk sonra: {}",
                        attempt, orderId, delayMin, e.getMessage());
            }
            outboxRepository.save(rec);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
