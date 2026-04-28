package com.petshop.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Email(message = "Geçerli bir email adresi girin")
        @NotBlank(message = "Email zorunludur")
        String email,

        @NotBlank(message = "Şifre zorunludur")
        String password
) {}
