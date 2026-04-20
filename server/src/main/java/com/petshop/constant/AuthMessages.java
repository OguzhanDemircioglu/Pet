package com.petshop.constant;

public enum AuthMessages {
    EMAIL_ALREADY_EXISTS("Bu email adresi zaten kayıtlıdır."),
    INVALID_CREDENTIALS("Email veya şifre hatalı"),
    GOOGLE_ACCOUNT_NO_PASSWORD("Bu hesap Google ile kayıtlıdır. Google ile giriş yapın."),
    ACCOUNT_DISABLED("Hesabınız devre dışı bırakılmıştır."),
    EMAIL_NOT_VERIFIED("Lütfen önce e-posta adresinizi doğrulayın."),
    EMAIL_ALREADY_VERIFIED("E-posta zaten doğrulanmış."),
    INVALID_VERIFICATION_CODE("Doğrulama kodu hatalı."),
    VERIFICATION_CODE_EXPIRED("Doğrulama kodunun süresi dolmuş."),
    INVALID_EMAIL("Geçersiz e-posta adresi."),
    USER_NOT_FOUND("Kullanıcı bulunamadı"),
    INVALID_REFRESH_TOKEN("Geçersiz refresh token"),
    REFRESH_TOKEN_EXPIRED("Refresh token süresi dolmuş veya iptal edilmiş"),
    GOOGLE_NO_EMAIL("Google hesabından e-posta bilgisi alınamadı."),
    GOOGLE_TOKEN_INVALID("Google token geçersiz veya süresi dolmuş."),
    GOOGLE_AUTH_FAILED("Google ile giriş başarısız"),
    LOG_EMAIL_QUEUE_FAIL("Email kuyruğa alınamadı (kayıt etkilenmedi): {}"),
    LOG_GOOGLE_FETCH_FAIL("Google userinfo fetch failed"),
    EMAIL_CHANGE_SAME("Yeni e-posta mevcut e-postanızla aynı olamaz."),
    EMAIL_CHANGE_IN_USE("Bu e-posta adresi başka bir hesap tarafından kullanılıyor."),
    EMAIL_CHANGE_SENT("Doğrulama e-postası gönderildi. Bağlantı 24 saat geçerlidir."),
    EMAIL_CHANGE_TOKEN_INVALID("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");

    private final String message;
    AuthMessages(String message) { this.message = message; }
    public String get() { return message; }
}
