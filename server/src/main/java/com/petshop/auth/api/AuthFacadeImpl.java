package com.petshop.auth.api;

import com.petshop.auth.dto.response.AdminInfoResponse;
import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AuthFacadeImpl implements AuthFacade {

    private final UserRepository userRepository;

    @Override
    public Optional<UserSummary> findUser(Long userId) {
        if (userId == null) return Optional.empty();
        return userRepository.findById(userId).map(AuthFacadeImpl::toSummary);
    }

    @Override
    public Map<Long, UserSummary> findUsers(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return Map.of();
        return userRepository.findAllById(new HashSet<>(userIds)).stream()
                .map(AuthFacadeImpl::toSummary)
                .collect(Collectors.toMap(UserSummary::id, Function.identity()));
    }

    @Override
    public List<UserSummary> findAdmins() {
        return userRepository.findByRole(User.Role.ADMIN).stream()
                .map(AuthFacadeImpl::toSummary)
                .toList();
    }

    @Override
    public boolean exists(Long userId) {
        return userId != null && userRepository.existsById(userId);
    }

    @Override
    public Optional<Integer> findTokenVersion(Long userId) {
        if (userId == null) return Optional.empty();
        return userRepository.findTokenVersionById(userId);
    }

    @Override
    public Optional<AdminInfoResponse> findFirstAdminInfo() {
        return userRepository.findFirstByRole(User.Role.ADMIN)
                .map(u -> new AdminInfoResponse(u.getEmail(), u.getPhone()));
    }

    @Override
    public int getVerificationCodeExpiryMinutes() {
        return com.petshop.auth.constant.AuthSchedulerConstants.VERIFICATION_CODE_EXPIRY_MINUTES;
    }

    static UserSummary toSummary(User u) {
        return new UserSummary(
                u.getId(),
                u.getFirstName(),
                u.getLastName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole() != null ? u.getRole().name() : null,
                Boolean.TRUE.equals(u.getEmailVerified())
        );
    }
}
