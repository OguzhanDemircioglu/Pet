package com.petshop.invoice.constant;

import com.petshop.invoice.constant.InvoiceSchedulerConstants;
/** Invoice outbox zamanlama sabitleri. */
public final class InvoiceSchedulerConstants {
    private InvoiceSchedulerConstants() {}

    public static final long INVOICE_OUTBOX_DELAY_MS = 60_000L;
    public static final int  OUTBOX_MAX_ATTEMPTS     = 3;
}
