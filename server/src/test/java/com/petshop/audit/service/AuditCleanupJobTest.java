package com.petshop.audit.service;

import com.petshop.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuditCleanupJobTest {

    @Test
    void cleanup_passes_cutoff_90_days_ago() {
        AuditLogRepository repo = mock(AuditLogRepository.class);
        when(repo.deleteOlderThan(any())).thenReturn(7);
        AuditCleanupJob job = new AuditCleanupJob(repo);

        LocalDateTime before = LocalDateTime.now();
        job.cleanup();

        ArgumentCaptor<LocalDateTime> cap = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(repo).deleteOlderThan(cap.capture());
        LocalDateTime cutoff = cap.getValue();
        long daysAgo = ChronoUnit.DAYS.between(cutoff, before);
        assertThat(daysAgo).isBetween(89L, 91L);
    }

    @Test
    void exception_in_repo_is_swallowed() {
        AuditLogRepository repo = mock(AuditLogRepository.class);
        when(repo.deleteOlderThan(any())).thenThrow(new RuntimeException("DB down"));
        AuditCleanupJob job = new AuditCleanupJob(repo);
        // No exception bubbles up — log only
        job.cleanup();
        verify(repo).deleteOlderThan(any());
    }
}
