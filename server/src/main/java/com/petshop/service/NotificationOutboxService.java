package com.petshop.service;

import com.petshop.constant.EmailMessages;
import com.petshop.constant.OutboxMessages;
import com.petshop.constant.SchedulerConstants;
import com.petshop.entity.NotificationOutbox;
import com.petshop.entity.NotificationOutbox.Status;
import com.petshop.repository.NotificationOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationOutboxService {

    private final NotificationOutboxRepository outboxRepository;
    private final EmailService emailService;
    private final SiteSettingsService siteSettings;

    private String appName() { return siteSettings.getAppName(); }

    // --- enqueue methods ---

    @Transactional
    public void enqueueVerificationCode(String toEmail, String firstName, String code) {
        String subject = appName() + EmailMessages.SUBJECT_VERIFY_SUFFIX.get();
        String html = emailService.buildVerificationEmail(firstName, code);
        save(toEmail, subject, html, true);   // commit sonrası anlık gönderim
    }

    @Transactional
    public void enqueueOrderConfirmation(String toEmail, String firstName, Long orderId,
                                          String itemsHtml, String deliveryAddress, String totalAmount) {
        String subject = EmailMessages.SUBJECT_ORDER_PREFIX.get() + orderId;
        String html = emailService.buildOrderConfirmationEmail(firstName, orderId, itemsHtml, deliveryAddress, totalAmount);
        save(toEmail, subject, html, false);  // sadece job ile gönderim
    }

    @Transactional
    public void enqueueStockNotification(String toEmail, String productName, String variantLabel, String productUrl) {
        String subject = appName() + " · Stoğa Geldi: " + productName;
        String html = emailService.buildStockNotificationEmail(productName, variantLabel, productUrl);
        save(toEmail, subject, html, true);   // commit sonrası anlık gönderim
    }

    @Transactional
    public void enqueueEmailChangeConfirmation(String toEmail, String firstName, String confirmUrl) {
        String subject = appName() + EmailMessages.SUBJECT_EMAIL_CHANGE.get();
        String html = emailService.buildEmailChangeEmail(firstName, confirmUrl);
        save(toEmail, subject, html, true);   // commit sonrası anlık gönderim
    }

    // --- scheduled job (1 dakika — retry safety net) ---

    @Scheduled(fixedDelay = SchedulerConstants.EMAIL_OUTBOX_DELAY_MS)
    @Transactional
    public void processOutbox() {
        List<NotificationOutbox> pending = outboxRepository.findByStatusAndAttemptCountLessThan(
                Status.PENDING, SchedulerConstants.OUTBOX_MAX_ATTEMPTS);

        if (pending.isEmpty()) return;
        log.debug(OutboxMessages.EMAIL_OUTBOX_PROCESSING.get(), pending.size());

        for (NotificationOutbox record : pending) {
            try {
                emailService.sendHtml(record.getRecipient(), record.getSubject(), record.getBody());
                record.setStatus(Status.SENT);
                record.setSentAt(LocalDateTime.now());
                log.info(OutboxMessages.EMAIL_SENT_JOB.get(), record.getRecipient(), record.getId());
            } catch (Exception e) {
                int attempt = record.getAttemptCount() + 1;
                record.setAttemptCount(attempt);
                record.setErrorMessage(e.getMessage());
                if (attempt >= SchedulerConstants.OUTBOX_MAX_ATTEMPTS) {
                    record.setStatus(Status.FAILED);
                    log.error(OutboxMessages.EMAIL_FAILED_PERMANENT.get(), record.getId(), record.getRecipient(), e.getMessage());
                } else {
                    log.warn(OutboxMessages.EMAIL_FAILED_RETRY.get(), record.getId(), attempt, e.getMessage());
                }
            }
            outboxRepository.save(record);
        }
    }

    // --- helpers ---

    private void save(String recipient, String subject, String body, boolean sendImmediately) {
        NotificationOutbox record = outboxRepository.save(NotificationOutbox.builder()
                .recipient(recipient)
                .subject(subject)
                .body(body)
                .build());

        if (sendImmediately) {
            Long id = record.getId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    CompletableFuture.runAsync(() -> trySendImmediately(id));
                }
            });
        }
    }

    private void trySendImmediately(Long id) {
        try {
            NotificationOutbox record = outboxRepository.findById(id).orElse(null);
            if (record == null || record.getStatus() != Status.PENDING) return;

            emailService.sendHtml(record.getRecipient(), record.getSubject(), record.getBody());
            record.setStatus(Status.SENT);
            record.setSentAt(LocalDateTime.now());
            outboxRepository.saveAndFlush(record);
            log.info(OutboxMessages.EMAIL_INSTANT_SUCCESS.get(), record.getRecipient(), id);
        } catch (Exception e) {
            log.warn(OutboxMessages.EMAIL_INSTANT_FAIL.get(), id, e.getMessage());
        }
    }
}
