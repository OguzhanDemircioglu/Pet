package com.petshop.saas.dto;

import jakarta.validation.constraints.*;

public record InviteUserRequest(
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @Size(max = 20) String firstName,
        @Size(max = 20) String lastName
) {}
