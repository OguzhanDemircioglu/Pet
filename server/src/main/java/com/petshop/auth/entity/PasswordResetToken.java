package com.petshop.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens", schema = "petshop",
       uniqueConstraints = @UniqueConstraint(columnNames = "token"),
       indexes = {
           @Index(name = "idx_pwd_reset_user", columnList = "user_id"),
           @Index(name = "idx_pwd_reset_token", columnList = "token"),
           @Index(name = "idx_pwd_reset_expires", columnList = "expires_at")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 128)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean isValid() {
        return !Boolean.TRUE.equals(used) && expiresAt.isAfter(LocalDateTime.now());
    }
}
