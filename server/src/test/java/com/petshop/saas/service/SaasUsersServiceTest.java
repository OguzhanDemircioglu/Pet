package com.petshop.saas.service;

import com.petshop.audit.service.AuditLogger;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.InviteUserRequest;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.exception.PlanFeatureLockedException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class SaasUsersServiceTest {

    private UserRepository userRepo;
    private PasswordEncoder encoder;
    private PlanLimitService planLimit;
    private AuditLogger audit;
    private SaasUsersService service;

    @BeforeEach
    void init() {
        userRepo = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        planLimit = mock(PlanLimitService.class);
        audit = mock(AuditLogger.class);
        service = new SaasUsersService(userRepo, encoder, planLimit, audit);
        TenantContext.set(7L, "PRO");
        when(encoder.encode(anyString())).thenReturn("hashed");
        when(userRepo.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            if (u.getId() == null) u.setId(99L);
            return u;
        });
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    @Test
    void list_returns_only_company_users() {
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(7L)).thenReturn(java.util.List.of(
                User.builder().id(1L).email("a@x.com").role(User.Role.ADMIN).isActive(true).build(),
                User.builder().id(2L).email("b@x.com").role(User.Role.ADMIN).isActive(false).build()
        ));
        var result = service.list();
        assertThat(result).hasSize(2);
        assertThat(result).extracting("email").containsExactly("a@x.com", "b@x.com");
    }

    @Test
    void invite_first_user_does_not_check_plan() {
        when(userRepo.countByCompanyId(7L)).thenReturn(0L);
        when(userRepo.existsByEmail("new@x.com")).thenReturn(false);

        service.invite(new InviteUserRequest("new@x.com", "secret123", "A", "B"));

        // İlk user → plan limit kontrolü yapılmaz (multi-user FREE'de 1 hakkı)
        verify(planLimit, never()).assertFeatureMultiUser(anyLong());
        verify(audit).log(eq("USER_INVITE"), eq("user"), eq(99L), anyString());
    }

    @Test
    void invite_second_user_requires_pro() {
        when(userRepo.countByCompanyId(7L)).thenReturn(1L);
        doThrow(new PlanFeatureLockedException("PRO gerekli")).when(planLimit).assertFeatureMultiUser(7L);

        assertThatThrownBy(() -> service.invite(new InviteUserRequest("new@x.com", "secret123", null, null)))
                .isInstanceOf(PlanFeatureLockedException.class);
        verify(userRepo, never()).save(any(User.class));
    }

    @Test
    void invite_existing_email_throws() {
        when(userRepo.countByCompanyId(7L)).thenReturn(0L);
        when(userRepo.existsByEmail("dupe@x.com")).thenReturn(true);

        assertThatThrownBy(() -> service.invite(new InviteUserRequest("dupe@x.com", "secret123", null, null)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void deactivate_own_user_succeeds() {
        User u = User.builder().id(99L).companyId(7L).email("x@x.com").isActive(true).build();
        when(userRepo.findByIdAndCompanyId(99L, 7L)).thenReturn(Optional.of(u));

        service.deactivate(99L);

        assertThat(u.getIsActive()).isFalse();
        verify(userRepo).save(u);
        verify(audit).log(eq("USER_DEACTIVATE"), eq("user"), eq(99L), anyString());
    }

    @Test
    void deactivate_cross_tenant_user_throws() {
        when(userRepo.findByIdAndCompanyId(42L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deactivate(42L))
                .isInstanceOf(CrossTenantAccessException.class);
    }
}
