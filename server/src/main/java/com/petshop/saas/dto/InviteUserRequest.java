package com.petshop.saas.dto;

import jakarta.validation.constraints.*;

public record InviteUserRequest(
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @Size(max = 20) String firstName,
        @Size(max = 20) String lastName,
        // Optional. Defaults to STAFF (daily ops only). Set to "ADMIN" to grant
        // full access (user mgmt, plan, settings, api keys, audit).
        @Pattern(regexp = "ADMIN|STAFF", message = "role: ADMIN veya STAFF") String role
) {}
