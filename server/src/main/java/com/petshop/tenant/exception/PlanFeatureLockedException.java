package com.petshop.tenant.exception;

public class PlanFeatureLockedException extends RuntimeException {
    public static final String CODE = "PLAN_FEATURE_LOCKED";

    public PlanFeatureLockedException(String message) {
        super(message);
    }
}
