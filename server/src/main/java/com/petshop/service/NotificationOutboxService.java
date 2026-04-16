package com.petshop.service;

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

    // --- enqueue methods ---

    @Transactional
    public void enqueueVerificationCode(String toEmail, String firstName, String code) {
        String subject = "PatilyaPetshop — E-posta Doğrulama Kodunuz";
        String html = emailService.buildVerificationEmail(firstName, code);
        save(toEmail, subject, html, true);   // commit sonrası anlık gönderim
    }

    @Transactional
    public void enqueueOrderConfirmation(String toEmail, String firstName, Long orderId,
                                          String itemsHtml, String deliveryAddress, String totalAmount) {
        String subject = "Siparişiniz Alındı - #" + orderId;
        String html = emailService.buildOrderConfirmationEmail(firstName, orderId, itemsHtml, deliveryAddress, totalAmount);
        save(toEmail, subject, html, false);  // sadece job ile gönderim
    }

    // --- scheduled job (1 dakika — retry safety net) ---

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void processOutbox() {
        List<NotificationOutbox> pending = outboxRepository.findByStatusAndAttemptCountLessThan(
                Status.PENDING, 3);

        if (pending.isEmpty()) return;
        log.debug("Email outbox (job): {} kayıt işleniyor", pending.size());

        for (NotificationOutbox record : pending) {
            try {
                emailService.sendHtml(record.getRecipient(), record.getSubject(), record.getBody());
                record.setStatus(Status.SENT);
                record.setSentAt(LocalDateTime.now());
                log.info("Email gönderildi (job) → {} (id={})", record.getRecipient(), record.getId());
            } catch (Exception e) {
                int attempt = record.getAttemptCount() + 1;
                record.setAttemptCount(attempt);
                record.setErrorMessage(e.getMessage());
                if (attempt >= 3) {
                    record.setStatus(Status.FAILED);
                    log.error("Email kalıcı olarak gönderilemedi (id={}, to={}): {}", record.getId(), record.getRecipient(), e.getMessage());
                } else {
                    log.warn("Email gönderilemedi, tekrar denenecek (id={}, attempt={}): {}", record.getId(), attempt, e.getMessage());
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
            log.info("Email anlık gönderim başarılı → {} (id={})", record.getRecipient(), id);
        } catch (Exception e) {
            log.warn("Email anlık gönderim başarısız, job retry edecek (id={}): {}", id, e.getMessage());
        }
    }
}
