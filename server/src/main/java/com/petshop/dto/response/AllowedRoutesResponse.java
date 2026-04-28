package com.petshop.dto.response;

import java.util.List;

public record AllowedRoutesResponse(
        List<String> publicRoutes,
        List<String> customerRoutes,
        List<String> adminRoutes
) {}
