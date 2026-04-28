package com.petshop.auth.constant;

import com.petshop.auth.constant.AuthSchedulerConstants;
/** Auth modülü zamanlama sabitleri. */
public final class AuthSchedulerConstants {
    private AuthSchedulerConstants() {}

    /** Doğrulama kodunun geçerlilik süresi (dakika) — hem backend hem frontend bu değeri kullanır. */
    public static final int VERIFICATION_CODE_EXPIRY_MINUTES = 3;
}
