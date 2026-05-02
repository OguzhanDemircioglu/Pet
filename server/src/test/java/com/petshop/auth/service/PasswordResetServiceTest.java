package com.petshop.auth.service;

import com.petshop.auth.entity.PasswordResetToken;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.PasswordResetTokenRepository;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.notification.api.NotificationFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {

    private UserRepository userRepo;
    private PasswordResetTokenRepository tokenRepo;
    private PasswordEncoder passwordEncoder;
    private NotificationFacade notificationFacade;
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        tokenRepo = mock(PasswordResetTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        notificationFacade = mock(NotificationFacade.class);
        service = new PasswordResetService(userRepo, tokenRepo, passwordEncoder, notificationFacade);
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:3000");
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");
        when(tokenRepo.save(any(PasswordResetToken.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void requestReset_existing_user_creates_token_and_sends_email() {
        User u = User.builder().id(1L).email("a@x.com").firstName("Ali").build();
        when(userRepo.findByEmail("a@x.com")).thenReturn(Optional.of(u));

        service.requestReset("a@x.com");

        verify(tokenRepo).invalidateAllForUser(1L);
        ArgumentCaptor<PasswordResetToken> cap = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepo).save(cap.capture());
        PasswordResetToken saved = cap.getValue();
        assertThat(saved.getUserId()).isEqualTo(1L);
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(25));

        ArgumentCaptor<String> urlCap = ArgumentCaptor.forClass(String.class);
        verify(notificationFacade).enqueuePasswordResetEmail(eq("a@x.com"), eq("Ali"), urlCap.capture());
        assertThat(urlCap.getValue()).startsWith("http://localhost:3000/sifre-sifirla?token=");
    }

    @Test
    void requestReset_unknown_email_silent_no_op() {
        when(userRepo.findByEmail("ghost@x.com")).thenReturn(Optional.empty());
        // No exception — user enumeration koruması
        service.requestReset("ghost@x.com");
        verify(tokenRepo, never()).save(any());
        verify(notificationFacade, never()).enqueuePasswordResetEmail(any(), any(), any());
    }

    @Test
    void confirmReset_valid_token_changes_password_and_bumps_token_version() {
        User u = User.builder().id(7L).email("a@x.com").passwordHash("old").tokenVersion(3).build();
        PasswordResetToken t = PasswordResetToken.builder()
                .id(1L).userId(7L).token("tok").expiresAt(LocalDateTime.now().plusMinutes(20))
                .used(false).build();
        when(tokenRepo.findByToken("tok")).thenReturn(Optional.of(t));
        when(userRepo.findById(7L)).thenReturn(Optional.of(u));

        service.confirmReset("tok", "newSecret123");

        assertThat(u.getPasswordHash()).isEqualTo("new-hash");
        assertThat(u.getTokenVersion()).isEqualTo(4);
        assertThat(t.getUsed()).isTrue();
        verify(userRepo).save(u);
        verify(tokenRepo).save(t);
        verify(tokenRepo).invalidateAllForUser(7L);
    }

    @Test
    void confirmReset_expired_token_throws() {
        PasswordResetToken expired = PasswordResetToken.builder()
                .userId(1L).token("old").expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false).build();
        when(tokenRepo.findByToken("old")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.confirmReset("old", "x123456"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("süresi dolmuş");
        verify(userRepo, never()).save(any());
    }

    @Test
    void confirmReset_used_token_throws() {
        PasswordResetToken used = PasswordResetToken.builder()
                .userId(1L).token("u").expiresAt(LocalDateTime.now().plusMinutes(20))
                .used(true).build();
        when(tokenRepo.findByToken("u")).thenReturn(Optional.of(used));

        assertThatThrownBy(() -> service.confirmReset("u", "x123456"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void confirmReset_unknown_token_throws() {
        when(tokenRepo.findByToken("none")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.confirmReset("none", "x123456"))
                .isInstanceOf(BusinessException.class);
    }
}
