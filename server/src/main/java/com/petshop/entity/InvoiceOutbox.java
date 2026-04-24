package com.petshop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_outbox", schema = "petshop",
       indexes = {
           @Index(name = "idx_invoice_outbox_status", columnList = "status"),
           @Index(name = "idx_invoice_outbox_order", columnList = "order_id", unique = true)
       })
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InvoiceOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation", nullable = false, length = 20)
    @Builder.Default
    private Operation operation = Operation.ISSUE;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public enum Status { PENDING, SUCCESS, FAILED }
    public enum Operation { ISSUE, CANCEL }
}
