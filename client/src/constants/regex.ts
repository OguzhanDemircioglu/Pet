/** Önyüzde kullanılan tüm regex sabitleri — tek yerden yönetilir */

/** E-posta doğrulama */
export const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

/** Telefon doğrulama — 05XX XXX XX XX (boşluklu veya boşluksuz) */
export const PHONE_RE = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/

/** Rakam dışı karakterleri temizleme */
export const NON_DIGIT_RE = /\D/g

/** Boşlukları temizleme */
export const WHITESPACE_RE = /\s/g

/** Hex renk kodu (#RRGGBB) */
export const HEX_COLOR_RE = /#[0-9a-fA-F]{6}/
