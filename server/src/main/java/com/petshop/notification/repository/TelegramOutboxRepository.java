package com.petshop.notification.repository;

import com.petshop.notification.entity.TelegramOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelegramOutboxRepository extends JpaRepository<TelegramOutbox, Long> {
    List<TelegramOutbox> findByStatusAndAttemptCountLessThan(TelegramOutbox.Status status, int maxAttempts);
}
