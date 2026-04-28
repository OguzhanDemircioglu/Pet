package com.petshop.auth.api;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Public API of the auth module. Consumers must depend only on this interface
 * and the DTOs in {@code com.petshop.auth.api}; never on {@code auth.entity}
 * or {@code auth.repository}.
 */
public interface AuthFacade {
    Optional<UserSummary> findUser(Long userId);

    Map<Long, UserSummary> findUsers(Collection<Long> userIds);

    List<UserSummary> findAdmins();

    boolean exists(Long userId);

    /** JWT auth filter: token-version check for revocation. */
    java.util.Optional<Integer> findTokenVersion(Long userId);

    /**
     * Public endpoint için: ilk admin'in iletişim bilgileri.
     */
    java.util.Optional<com.petshop.auth.dto.response.AdminInfoResponse> findFirstAdminInfo();

    /**
     * Frontend doğrulama geri sayımı için backend sabiti — auth modülü kendi
     * scheduler constant'ını dış dünyaya facade üzerinden expose eder.
     */
    int getVerificationCodeExpiryMinutes();
}
