package com.petshop.constant;

public final class SchedulerConstants {
    private SchedulerConstants() {}

    public static final long EMAIL_OUTBOX_DELAY_MS   = 60_000L;
    public static final long TELEGRAM_OUTBOX_DELAY_MS = 60_000L;
    public static final int  OUTBOX_MAX_ATTEMPTS      = 3;
}
