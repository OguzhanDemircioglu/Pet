package com.petshop.repository;

import com.petshop.entity.InvoiceOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceOutboxRepository extends JpaRepository<InvoiceOutbox, Long> {

    Optional<InvoiceOutbox> findByOrderId(Long orderId);

    List<InvoiceOutbox> findByStatusAndNextRetryAtBefore(
            InvoiceOutbox.Status status,
            LocalDateTime now);
}
