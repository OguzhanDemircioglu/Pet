package com.petshop.tenant.exception;

public class PlanLimitExceededException extends RuntimeException {
    public static final String CODE = "PLAN_LIMIT_EXCEEDED";

    public PlanLimitExceededException(String message) {
        super(message);
    }
}
