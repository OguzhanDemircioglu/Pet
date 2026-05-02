package com.petshop.auth.dto.response;

import com.petshop.auth.entity.User;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String role,
        Long companyId,
        String plan,
        boolean pendingEmailChange
) {
    public static UserResponse from(User user) {
        return from(user, false, null);
    }

    public static UserResponse from(User user, boolean pendingEmailChange) {
        return from(user, pendingEmailChange, null);
    }

    public static UserResponse from(User user, boolean pendingEmailChange, String plan) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().name(),
                user.getCompanyId(),
                plan,
                pendingEmailChange
        );
    }
}
