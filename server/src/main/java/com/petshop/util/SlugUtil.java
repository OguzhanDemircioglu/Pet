package com.petshop.util;

/**
 * Türkçe metni URL-safe ASCII slug'a dönüştüren statik yardımcı.
 *
 * <p>Kullanım yerleri (statik çağrı, dependency-injection yok):
 * <ul>
 *   <li>{@code catalog.service.ProductService} — yeni ürün veya güncelleme
 *       sırasında {@code product.slug} alanını ürün adından üretir.</li>
 *   <li>{@code catalog.controller.admin.AdminCategoryController} — kategori
 *       create/update sırasında aynı şekilde.</li>
 * </ul>
 *
 * <p>Üretilen slug, ürün ve kategori URL'lerinde kullanılır:
 * "Köpek Maması Premium" → "kopek-mamasi-premium" → {@code /urun/kopek-mamasi-premium}.
 * Hem SEO için (Google Türkçe karakterli URL'leri zayıf indeksler) hem de
 * URL encoding'in çirkin sonuçlarından kaçınmak için gerekli.
 *
 * <p><b>Neden custom yazıldı?</b> Apache Commons Text / Slugify benzeri
 * kütüphaneler Türkçe karakterlerin (özellikle "ı" ve "İ") tamamını doğru
 * handle etmiyor. Ek bağımlılık yerine 20 satırlık deterministik mapping
 * tercih edildi.
 *
 * <p><b>Neden util paketinde?</b> Pure function — entity, repository veya
 * dış bağımlılığı yok. Birden fazla modülün ihtiyaç duyabilmesi (şu an
 * yalnız catalog kullanıyor; ileride blog, kampanya vs. eklerse yine işe
 * yarar) sebebiyle ortak {@code com.petshop.util} paketinde tutuluyor.
 */
public final class SlugUtil {

    private SlugUtil() {}

    /**
     * Verilen Türkçe metni URL slug'a çevirir.
     *
     * <p>Sıralı dönüşümler:
     * <ol>
     *   <li>trim + toLowerCase</li>
     *   <li>Türkçe karakter → ASCII (ş→s, ç→c, ğ→g, ü→u, ö→o, ı→i, İ→i, ...)</li>
     *   <li>Alfanümerik / boşluk / tire dışındaki karakterler atılır</li>
     *   <li>Boşluklar tek tireye dönüştürülür</li>
     *   <li>Ardışık tireler tek tireye iner</li>
     *   <li>Baştaki/sondaki tireler kırpılır</li>
     * </ol>
     *
     * <p>Örnek: {@code "Çocuk & Pet Şampuan %50!"} → {@code "cocuk-pet-sampuan-50"}.
     *
     * @param input ham metin; {@code null} geçilirse boş string döner
     * @return URL'de güvenle kullanılabilen ASCII slug
     */
    public static String toSlug(String input) {
        if (input == null) return "";
        String result = input.trim().toLowerCase();
        result = result
                .replace('ş', 's').replace('ç', 'c').replace('ğ', 'g')
                .replace('ü', 'u').replace('ö', 'o').replace('ı', 'i')
                .replace('İ', 'i').replace('Ş', 's').replace('Ç', 'c')
                .replace('Ğ', 'g').replace('Ü', 'u').replace('Ö', 'o');
        result = result.replaceAll("[^a-z0-9\\s-]", "");
        result = result.replaceAll("[\\s]+", "-");
        result = result.replaceAll("-{2,}", "-");
        result = result.replaceAll("^-|-$", "");
        return result;
    }
}
