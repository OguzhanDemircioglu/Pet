package com.petshop.notification.repository;

import com.petshop.notification.entity.NotificationOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {
    List<NotificationOutbox> findByStatusAndAttemptCountLessThan(
            NotificationOutbox.Status status,
            int maxAttempts);
}
