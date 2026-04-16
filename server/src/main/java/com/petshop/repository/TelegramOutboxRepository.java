package com.petshop.repository;

import com.petshop.entity.TelegramOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelegramOutboxRepository extends JpaRepository<TelegramOutbox, Long> {
    List<TelegramOutbox> findByStatusAndAttemptCountLessThan(TelegramOutbox.Status status, int maxAttempts);
}
