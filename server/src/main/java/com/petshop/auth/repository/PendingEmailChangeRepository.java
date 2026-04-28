package com.petshop.auth.repository;

import com.petshop.auth.entity.PendingEmailChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PendingEmailChangeRepository extends JpaRepository<PendingEmailChange, Long> {

    Optional<PendingEmailChange> findByToken(String token);

    Optional<PendingEmailChange> findByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM PendingEmailChange p WHERE p.expiresAt < :now")
    int deleteExpiredBefore(LocalDateTime now);
}
