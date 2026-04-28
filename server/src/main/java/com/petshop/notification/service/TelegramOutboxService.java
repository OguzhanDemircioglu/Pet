package com.petshop.notification.service;

import com.petshop.notification.constant.NotificationSchedulerConstants;
import com.petshop.notification.constant.OutboxMessages;
import com.petshop.notification.entity.TelegramOutbox;
import com.petshop.notification.entity.TelegramOutbox.Status;
import com.petshop.notification.repository.TelegramOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelegramOutboxService {

    private final TelegramOutboxRepository outboxRepository;
    private final TelegramService telegramService;

    @Transactional
    public void enqueue(String text) {
        outboxRepository.save(TelegramOutbox.builder()
                .body(text)
                .build());
    }

    @Scheduled(fixedDelay = NotificationSchedulerConstants.TELEGRAM_OUTBOX_DELAY_MS)
    @Transactional
    public void processOutbox() {
        List<TelegramOutbox> pending = outboxRepository.findByStatusAndAttemptCountLessThan(
                Status.PENDING, NotificationSchedulerConstants.OUTBOX_MAX_ATTEMPTS);

        if (pending.isEmpty()) return;
        log.debug(OutboxMessages.TELEGRAM_OUTBOX_PROCESSING.get(), pending.size());

        for (TelegramOutbox record : pending) {
            try {
                telegramService.sendMessage(record.getBody());
                record.setStatus(Status.SENT);
                record.setSentAt(LocalDateTime.now());
                log.info(OutboxMessages.TELEGRAM_SENT_JOB.get(), record.getId());
            } catch (Exception e) {
                int attempt = record.getAttemptCount() + 1;
                record.setAttemptCount(attempt);
                record.setErrorMessage(e.getMessage());
                if (attempt >= NotificationSchedulerConstants.OUTBOX_MAX_ATTEMPTS) {
                    record.setStatus(Status.FAILED);
                    log.error(OutboxMessages.TELEGRAM_FAILED_PERMANENT.get(), record.getId(), e.getMessage());
                } else {
                    log.warn(OutboxMessages.TELEGRAM_FAILED_RETRY.get(), record.getId(), attempt, e.getMessage());
                }
            }
            outboxRepository.save(record);
        }
    }
}
