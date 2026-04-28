package com.petshop.invoice.api;

/**
 * Public API of the invoice module.
 *
 * Used by the payment module to enqueue invoice operations after payment success
 * or refund. Implementation persists an outbox row and triggers async processing.
 */
public interface InvoiceFacade {

    /** Enqueue an "issue invoice" operation for the given order. Idempotent. */
    void enqueueIssue(Long orderId);

    /** Enqueue a "cancel invoice" operation for the given order. Idempotent. */
    void enqueueCancel(Long orderId);

    /** Admin: retry a previously FAILED outbox entry — resets attempt count and schedules immediate retry. */
    void retry(Long orderId);
}
