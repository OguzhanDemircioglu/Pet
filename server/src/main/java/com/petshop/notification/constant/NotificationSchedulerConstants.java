package com.petshop.notification.constant;

import com.petshop.notification.constant.NotificationSchedulerConstants;
/** Notification (email + telegram outbox) zamanlama sabitleri. */
public final class NotificationSchedulerConstants {
    private NotificationSchedulerConstants() {}

    public static final long EMAIL_OUTBOX_DELAY_MS    = 60_000L;
    public static final long TELEGRAM_OUTBOX_DELAY_MS = 60_000L;
    public static final int  OUTBOX_MAX_ATTEMPTS      = 3;
}
