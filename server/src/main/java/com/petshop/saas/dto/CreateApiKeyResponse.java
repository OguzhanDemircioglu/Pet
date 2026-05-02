package com.petshop.saas.dto;

/**
 * Plaintext key sadece BURADA döner — bir daha gösterilmez.
 * UI uyarı gösterir: "tek seferlik, kopyala/sakla".
 */
public record CreateApiKeyResponse(
        ApiKeyDto key,
        String plaintext
) {}
