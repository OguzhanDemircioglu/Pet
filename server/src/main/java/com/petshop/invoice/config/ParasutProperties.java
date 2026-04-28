package com.petshop.invoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "parasut")
public record ParasutProperties(
        boolean enabled,
        String clientId,
        String clientSecret,
        String username,
        String password,
        String companyId,
        String baseUrl
) {}
