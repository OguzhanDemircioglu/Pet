package com.petshop.tenant.exception;

public class CrossTenantAccessException extends RuntimeException {
    public static final String CODE = "CROSS_TENANT_ACCESS";

    public CrossTenantAccessException(String message) {
        super(message);
    }
}
