package com.offcats.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "Geçerli bir email adresi girin")
        @NotBlank(message = "Email zorunludur")
        @Pattern(
            regexp = "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$",
            message = "Geçerli bir email adresi girin"
        )
        String email,

        @NotBlank(message = "Şifre zorunludur")
        @Size(min = 8, message = "Şifre en az 8 karakter olmalıdır")
        String password,

        @NotBlank(message = "Ad zorunludur")
        String firstName,

        @NotBlank(message = "Soyad zorunludur")
        String lastName,

        @NotBlank(message = "Telefon numarası zorunludur")
        @Pattern(
            regexp = "^05\\d{2}\\s?\\d{3}\\s?\\d{2}\\s?\\d{2}$",
            message = "Telefon numarası 05XX XXX XX XX formatında olmalıdır"
        )
        String phone
) {}
