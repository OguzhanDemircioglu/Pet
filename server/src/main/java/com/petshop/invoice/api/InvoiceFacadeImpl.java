package com.petshop.invoice.api;

import com.petshop.invoice.service.InvoiceOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class InvoiceFacadeImpl implements InvoiceFacade {

    private final InvoiceOutboxService outboxService;

    @Override
    public void enqueueIssue(Long orderId) {
        outboxService.enqueueIssue(orderId);
    }

    @Override
    public void enqueueCancel(Long orderId) {
        outboxService.enqueueCancel(orderId);
    }

    @Override
    public void retry(Long orderId) {
        outboxService.retry(orderId);
    }
}
