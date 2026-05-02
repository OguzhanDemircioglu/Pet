package com.petshop.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys", schema = "petshop",
       uniqueConstraints = @UniqueConstraint(columnNames = "key_hash"),
       indexes = {
           @Index(name = "idx_api_keys_company", columnList = "company_id"),
           @Index(name = "idx_api_keys_hash",    columnList = "key_hash")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 10)
    private String prefix;

    @Column(name = "key_hash", nullable = false, length = 128)
    private String keyHash;

    @Column(name = "last_four", nullable = false, length = 8)
    private String lastFour;

    @Column(length = 500)
    private String scopes;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean isActive() {
        return revokedAt == null;
    }
}
