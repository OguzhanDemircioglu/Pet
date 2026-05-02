package com.petshop.tenant.service;

/**
 * Request scope'lu thread-local tenant id taşıyıcısı.
 * TenantFilter set/clear eder. @Async metotlarda TaskDecorator ile propagate edilmeli.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> PLAN = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Long companyId, String plan) {
        COMPANY_ID.set(companyId);
        PLAN.set(plan);
    }

    public static Long get() {
        return COMPANY_ID.get();
    }

    public static Long require() {
        Long id = COMPANY_ID.get();
        if (id == null) {
            throw new IllegalStateException("TenantContext.companyId yok — JWT'de companyId claim'i eksik olabilir");
        }
        return id;
    }

    public static String getPlan() {
        return PLAN.get();
    }

    public static void clear() {
        COMPANY_ID.remove();
        PLAN.remove();
    }
}
