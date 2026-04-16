package com.petshop.repository;

import com.petshop.entity.NotificationOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {
    List<NotificationOutbox> findByStatusAndAttemptCountLessThan(
            NotificationOutbox.Status status,
            int maxAttempts);
}
