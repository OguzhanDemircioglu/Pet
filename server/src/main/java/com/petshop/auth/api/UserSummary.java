package com.petshop.auth.api;

/**
 * Cross-module snapshot of a user. Other modules must use this via {@link AuthFacade}
 * instead of importing the User entity directly.
 */
public record UserSummary(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        boolean emailVerified
) {
    public String fullName() {
        StringBuilder sb = new StringBuilder();
        if (firstName != null) sb.append(firstName);
        if (lastName != null) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(lastName);
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
