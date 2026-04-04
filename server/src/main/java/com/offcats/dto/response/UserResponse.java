package com.offcats.dto.response;

import com.offcats.entity.User;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().name()
        );
    }
}
