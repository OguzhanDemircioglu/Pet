package com.petshop.service;

import com.petshop.entity.TelegramOutbox;
import com.petshop.entity.TelegramOutbox.Status;
import com.petshop.repository.TelegramOutboxRepository;
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

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void processOutbox() {
        List<TelegramOutbox> pending = outboxRepository.findByStatusAndAttemptCountLessThan(
                Status.PENDING, 3);

        if (pending.isEmpty()) return;
        log.debug("Telegram outbox (job): {} kayıt işleniyor", pending.size());

        for (TelegramOutbox record : pending) {
            try {
                telegramService.sendMessage(record.getBody());
                record.setStatus(Status.SENT);
                record.setSentAt(LocalDateTime.now());
                log.info("Telegram mesajı gönderildi (job) (id={})", record.getId());
            } catch (Exception e) {
                int attempt = record.getAttemptCount() + 1;
                record.setAttemptCount(attempt);
                record.setErrorMessage(e.getMessage());
                if (attempt >= 3) {
                    record.setStatus(Status.FAILED);
                    log.error("Telegram mesajı kalıcı olarak gönderilemedi (id={}): {}", record.getId(), e.getMessage());
                } else {
                    log.warn("Telegram mesajı gönderilemedi, tekrar denenecek (id={}, attempt={}): {}", record.getId(), attempt, e.getMessage());
                }
            }
            outboxRepository.save(record);
        }
    }

}
