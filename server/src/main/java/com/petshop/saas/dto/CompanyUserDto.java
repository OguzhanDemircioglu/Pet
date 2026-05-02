package com.petshop.saas.dto;

import com.petshop.auth.entity.User;

import java.time.LocalDateTime;

public record CompanyUserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        Boolean isActive,
        LocalDateTime createdAt
) {
    public static CompanyUserDto from(User u) {
        return new CompanyUserDto(
                u.getId(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getRole().name(),
                u.getIsActive(),
                u.getCreatedAt()
        );
    }
}
