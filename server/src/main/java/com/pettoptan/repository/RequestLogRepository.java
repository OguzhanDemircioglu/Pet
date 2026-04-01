package com.pettoptan.repository;

import com.pettoptan.entity.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {

    @Modifying
    @Query("DELETE FROM RequestLog r WHERE r.createdAt < :before")
    int deleteOlderThan(LocalDateTime before);
}
