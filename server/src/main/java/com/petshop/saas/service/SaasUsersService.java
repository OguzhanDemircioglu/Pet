package com.petshop.saas.service;

import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.CompanyUserDto;
import com.petshop.saas.dto.InviteUserRequest;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SaasUsersService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlanLimitService planLimitService;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @Transactional(readOnly = true)
    public List<CompanyUserDto> list() {
        Long cid = TenantContext.require();
        return userRepository.findByCompanyIdOrderByCreatedAtDesc(cid)
                .stream().map(CompanyUserDto::from).toList();
    }

    @Transactional
    public CompanyUserDto invite(InviteUserRequest req) {
        Long cid = TenantContext.require();
        // FREE plan tek user — multi-user PRO
        if (userRepository.countByCompanyId(cid) >= 1) {
            planLimitService.assertFeatureMultiUser(cid);
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException("Bu e-posta zaten kullanılıyor");
        }
        // Default to STAFF (daily ops). Owner can promote later or pass role=ADMIN
        // explicitly when they want to grant full access. Cannot invite as CUSTOMER.
        User.Role assigned = (req.role() == null) ? User.Role.STAFF : User.Role.valueOf(req.role());
        User u = User.builder()
                .companyId(cid)
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(assigned)
                .isActive(true)
                .emailVerified(true)
                .build();
        User saved = userRepository.save(u);
        auditLogger.log("USER_INVITE", "user", saved.getId(),
                "email=" + saved.getEmail() + " role=" + assigned.name());
        return CompanyUserDto.from(saved);
    }

    @Transactional
    public void deactivate(Long userId) {
        Long cid = TenantContext.require();
        User u = userRepository.findByIdAndCompanyId(userId, cid)
                .orElseThrow(() -> new CrossTenantAccessException("User " + userId));
        u.setIsActive(false);
        userRepository.save(u);
        auditLogger.log("USER_DEACTIVATE", "user", userId, "email=" + u.getEmail());
    }
}
