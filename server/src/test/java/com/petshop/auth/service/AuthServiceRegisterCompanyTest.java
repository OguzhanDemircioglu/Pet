package com.petshop.auth.service;

import com.petshop.auth.dto.request.RegisterCompanyRequest;
import com.petshop.auth.dto.response.AuthResponse;
import com.petshop.auth.entity.RefreshToken;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.PendingEmailChangeRepository;
import com.petshop.auth.repository.RefreshTokenRepository;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import com.petshop.tenant.service.CompanyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AuthServiceRegisterCompanyTest {

    private UserRepository userRepository;
    private CompanyService companyService;
    private CompanyRepository companyRepository;
    private JwtTokenProvider jwtTokenProvider;
    private PasswordEncoder passwordEncoder;
    private RefreshTokenRepository refreshTokenRepository;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        companyService = mock(CompanyService.class);
        companyRepository = mock(CompanyRepository.class);
        jwtTokenProvider = new JwtTokenProvider("test-secret-test-secret-test-secret-test!", 60_000L);
        passwordEncoder = mock(PasswordEncoder.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);

        service = new AuthService(
                userRepository,
                refreshTokenRepository,
                jwtTokenProvider,
                passwordEncoder,
                mock(NotificationFacade.class),
                mock(PendingEmailChangeRepository.class),
                companyRepository,
                companyService
        );
        ReflectionTestUtils.setField(service, "refreshTokenExpirationMs", 604_800_000L);

        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        AtomicLong userIdSeq = new AtomicLong(1);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId(userIdSeq.getAndIncrement());
            return u;
        });
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void register_company_creates_company_and_admin_user_and_returns_token() {
        Company company = Company.builder().id(99L).name("Test Petshop").slug("test-petshop").plan(Plan.FREE).isActive(true).build();
        when(userRepository.existsByEmail("admin@test.com")).thenReturn(false);
        when(companyService.createCompany("Test Petshop", Plan.FREE)).thenReturn(company);
        when(companyRepository.findPlanById(99L)).thenReturn(Optional.of(Plan.FREE));

        AuthResponse res = service.registerCompany(new RegisterCompanyRequest(
                "Test Petshop", "admin@test.com", "secret123", "Ali", "Veli"));

        assertThat(res.accessToken()).isNotBlank();
        assertThat(res.refreshToken()).isNotBlank();
        assertThat(res.user().email()).isEqualTo("admin@test.com");
        assertThat(res.user().role()).isEqualTo("ADMIN");
        assertThat(res.user().companyId()).isEqualTo(99L);
        assertThat(res.user().plan()).isEqualTo("FREE");

        // JWT token doğru claim'leri taşıyor mu
        assertThat(jwtTokenProvider.getCompanyIdFromToken(res.accessToken())).isEqualTo(99L);
        assertThat(jwtTokenProvider.getPlanFromToken(res.accessToken())).isEqualTo("FREE");
        assertThat(jwtTokenProvider.getRoleFromToken(res.accessToken())).isEqualTo("ADMIN");

        // Company FREE plan ile yaratıldı
        verify(companyService).createCompany("Test Petshop", Plan.FREE);
        // User company'ye bağlı + ADMIN + emailVerified
        verify(userRepository).save(argThat(u ->
                u.getCompanyId().equals(99L) &&
                u.getRole() == User.Role.ADMIN &&
                Boolean.TRUE.equals(u.getEmailVerified())
        ));
    }

    @Test
    void register_company_existing_email_throws() {
        when(userRepository.existsByEmail("dupe@test.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registerCompany(new RegisterCompanyRequest(
                "X", "dupe@test.com", "secret123", null, null)))
                .isInstanceOf(BusinessException.class);

        verify(companyService, never()).createCompany(anyString(), any());
        verify(userRepository, never()).save(any(User.class));
    }
}
