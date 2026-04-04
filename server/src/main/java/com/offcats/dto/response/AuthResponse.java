package com.offcats.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
