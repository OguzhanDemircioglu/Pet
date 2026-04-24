/** Uygulama genelinde kullanılan sabitler — tek yerden yönetilir */

/**
 * Fallback değerler. Gerçek değerler DB'den `useSiteSettings()` hook'u ile alınır.
 * Bu sabitler sadece store hazır olmadan önceki ilk render veya React dışı
 * kullanımlar için default olarak tutulur.
 */
export const CONTACT_PHONE_FALLBACK = '905527735994'
export const CONTACT_EMAIL_FALLBACK = 'info@pettoptan.com.tr'
