package com.petshop.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Uygulama ilk kez başladığında örnek verileri ekler.
 * brands tablosunda kayıt varsa hiçbir şey yapmaz (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Integer brandCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM petshop.brands", Integer.class);

        if (brandCount != null && brandCount > 0) {
            log.info("DataSeeder: Veriler zaten mevcut ({} marka), seed atlanıyor.", brandCount);
            return;
        }

        log.info("DataSeeder: Başlangıç verileri ekleniyor...");
        seedCategories();
        seedBrands();
        seedCampaigns();
        seedProducts();
        seedProductImages();
        seedCategoryDiscounts();
        log.info("DataSeeder: Tüm veriler başarıyla eklendi.");
    }

    // ── Categories ────────────────────────────────────────────────────────────

    private void seedCategories() {
        String sql = "INSERT INTO petshop.categories " +
                "(id, created_at, description, display_order, image_url, is_active, name, slug, updated_at, parent_id, emoji) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {1,  "2026-04-05 15:31:45.860597", null, 1,  null, true, "Kedi",                   "kedi",                        "2026-04-05 15:31:45.860597", null, "🐱"},
            {2,  "2026-04-05 15:31:45.860597", null, 2,  null, true, "Köpek",                  "kopek",                       "2026-04-05 15:31:45.860597", null, "🐶"},
            {3,  "2026-04-05 15:31:45.860597", null, 3,  null, true, "Kuş",                    "kus",                         "2026-04-05 15:31:45.860597", null, "🐦"},
            {4,  "2026-04-05 15:31:45.860597", null, 4,  null, true, "Akvaryum",               "akvaryum",                    "2026-04-05 15:31:45.860597", null, "🐟"},
            {5,  "2026-04-05 15:31:45.860597", null, 5,  null, true, "Kemirgen",               "kemirgen",                    "2026-04-05 15:31:45.860597", null, "🐹"},
            {6,  "2026-04-05 15:31:45.860597", null, 6,  null, true, "Sürüngen",               "surungenler",                 "2026-04-05 15:31:45.860597", null, "🦎"},
            {7,  "2026-04-05 15:31:46.028871", null, 1,  null, true, "Kuru Mamalar",           "kedi-kuru-mamalar",           "2026-04-05 15:31:46.028871", 1,    "🥩"},
            {8,  "2026-04-05 15:31:46.028871", null, 2,  null, true, "Yaş Mamalar",            "kedi-yas-mamalar",            "2026-04-05 15:31:46.028871", 1,    "🥫"},
            {9,  "2026-04-05 15:31:46.028871", null, 3,  null, true, "Ödüller",                "kedi-oduller",                "2026-04-05 15:31:46.028871", 1,    "🍬"},
            {10, "2026-04-05 15:31:46.028871", null, 4,  null, true, "Mama ve Su Kapları",     "kedi-mama-ve-su-kaplari",     "2026-04-05 15:31:46.028871", 1,    "🍽️"},
            {11, "2026-04-05 15:31:46.028871", null, 5,  null, true, "Kumlar",                 "kedi-kumlar",                 "2026-04-05 15:31:46.028871", 1,    "🪣"},
            {12, "2026-04-05 15:31:46.028871", null, 6,  null, true, "Oyuncaklar",             "kedi-oyuncaklar",             "2026-04-05 15:31:46.028871", 1,    "🎾"},
            {13, "2026-04-05 15:31:46.028871", null, 7,  null, true, "Tasmalar",               "kedi-tasmalar",               "2026-04-05 15:31:46.028871", 1,    "📿"},
            {14, "2026-04-05 15:31:46.028871", null, 8,  null, true, "Yatak ve Yuvalar",       "kedi-yatak-ve-yuvalar",       "2026-04-05 15:31:46.028871", 1,    "🛏️"},
            {15, "2026-04-05 15:31:46.028871", null, 9,  null, true, "Bakım Ürünleri",         "kedi-bakim-urunleri",         "2026-04-05 15:31:46.028871", 1,    "🚿"},
            {16, "2026-04-05 15:31:46.028871", null, 10, null, true, "Vitamin ve Katkıları",   "kedi-vitamin-ve-katkilari",   "2026-04-05 15:31:46.028871", 1,    "💊"},
            {17, "2026-04-05 15:31:46.206564", null, 1,  null, true, "Kuru Mamalar",           "kopek-kuru-mamalar",          "2026-04-05 15:31:46.206564", 2,    "🥩"},
            {18, "2026-04-05 15:31:46.206564", null, 2,  null, true, "Yaş Mamalar",            "kopek-yas-mamalar",           "2026-04-05 15:31:46.206564", 2,    "🥫"},
            {19, "2026-04-05 15:31:46.206564", null, 3,  null, true, "Ödüller",                "kopek-oduller",               "2026-04-05 15:31:46.206564", 2,    "🍬"},
            {20, "2026-04-05 15:31:46.206564", null, 4,  null, true, "Mama ve Su Kapları",     "kopek-mama-ve-su-kaplari",    "2026-04-05 15:31:46.206564", 2,    "🍽️"},
            {21, "2026-04-05 15:31:46.206564", null, 5,  null, true, "Oyuncaklar",             "kopek-oyuncaklar",            "2026-04-05 15:31:46.206564", 2,    "🎾"},
            {22, "2026-04-05 15:31:46.206564", null, 6,  null, true, "Tasmalar",               "kopek-tasmalar",              "2026-04-05 15:31:46.206564", 2,    "📿"},
            {23, "2026-04-05 15:31:46.206564", null, 7,  null, true, "Gezdirme Ürünleri",      "kopek-gezdirme-urunleri",     "2026-04-05 15:31:46.206564", 2,    "🚶"},
            {24, "2026-04-05 15:31:46.206564", null, 8,  null, true, "Yataklar",               "kopek-yataklar",              "2026-04-05 15:31:46.206564", 2,    "🛏️"},
            {25, "2026-04-05 15:31:46.206564", null, 9,  null, true, "Aksesuarlar",            "kopek-aksesuarlar",           "2026-04-05 15:31:46.206564", 2,    "🎒"},
            {26, "2026-04-05 15:31:46.206564", null, 10, null, true, "Vitaminler",             "kopek-vitaminler",            "2026-04-05 15:31:46.206564", 2,    "💊"},
            {27, "2026-04-05 15:31:46.206564", null, 11, null, true, "Bakım Ürünleri",         "kopek-bakim-urunleri",        "2026-04-05 15:31:46.206564", 2,    "🚿"},
            {28, "2026-04-05 15:31:46.386363", null, 1,  null, true, "Yemler",                 "kus-yemler",                  "2026-04-05 15:31:46.386363", 3,    "🌾"},
            {29, "2026-04-05 15:31:46.386363", null, 2,  null, true, "Krakerler",              "kus-krakerler",               "2026-04-05 15:31:46.386363", 3,    "🍘"},
            {30, "2026-04-05 15:31:46.386363", null, 3,  null, true, "Kumlar",                 "kus-kumlar",                  "2026-04-05 15:31:46.386363", 3,    "🪣"},
            {31, "2026-04-05 15:31:46.386363", null, 4,  null, true, "Kafesler",               "kus-kafesler",                "2026-04-05 15:31:46.386363", 3,    "🏠"},
            {32, "2026-04-05 15:31:46.386363", null, 5,  null, true, "Oyuncaklar",             "kus-oyuncaklar",              "2026-04-05 15:31:46.386363", 3,    "🎾"},
            {33, "2026-04-05 15:31:46.386363", null, 6,  null, true, "Aksesuarlar",            "kus-aksesuarlar",             "2026-04-05 15:31:46.386363", 3,    "🎒"},
            {34, "2026-04-05 15:31:46.551286", null, 1,  null, true, "Balık Yemi",             "akvaryum-balik-yemi",         "2026-04-05 15:31:46.551286", 4,    "🍱"},
            {35, "2026-04-05 15:31:46.551286", null, 2,  null, true, "Balık Vitamin & Mineral","akvaryum-balik-vitamin-mineral","2026-04-05 15:31:46.551286", 4,   "💊"},
            {36, "2026-04-05 15:31:46.551286", null, 3,  null, true, "Akvaryum ve Fanus",      "akvaryum-ve-fanus",           "2026-04-05 15:31:46.551286", 4,    "🏺"},
            {37, "2026-04-05 15:31:46.551286", null, 4,  null, true, "Su Düzenleyiciler",      "akvaryum-su-duzenleyiciler",  "2026-04-05 15:31:46.551286", 4,    "🧪"},
            {38, "2026-04-05 15:31:46.551286", null, 5,  null, true, "Bakım & Temizlik",       "akvaryum-bakim-temizlik",     "2026-04-05 15:31:46.551286", 4,    "🧹"},
            {39, "2026-04-05 15:31:46.551286", null, 6,  null, true, "Aydınlatma",             "akvaryum-aydinlatma",         "2026-04-05 15:31:46.551286", 4,    "💡"},
            {40, "2026-04-05 15:31:46.551286", null, 7,  null, true, "Ekipman & Aksesuarlar",  "akvaryum-ekipman-aksesuarlar","2026-04-05 15:31:46.551286", 4,    "⚙️"},
            {41, "2026-04-05 15:31:46.551286", null, 8,  null, true, "Filtreler",              "akvaryum-filtreler",          "2026-04-05 15:31:46.551286", 4,    "🔄"},
            {42, "2026-04-05 15:31:46.551286", null, 9,  null, true, "Isıtma & Soğutma",       "akvaryum-isitma-sogutma",     "2026-04-05 15:31:46.551286", 4,    "🌡️"},
            {43, "2026-04-05 15:31:46.712490", null, 1,  null, true, "Yemler",                 "kemirgen-yemler",             "2026-04-05 15:31:46.712490", 5,    "🌾"},
            {44, "2026-04-05 15:31:46.712490", null, 2,  null, true, "Kafesler",               "kemirgen-kafesler",           "2026-04-05 15:31:46.712490", 5,    "🏠"},
            {45, "2026-04-05 15:31:46.712490", null, 3,  null, true, "Oyuncaklar",             "kemirgen-oyuncaklar",         "2026-04-05 15:31:46.712490", 5,    "🎾"},
            {46, "2026-04-05 15:31:46.712490", null, 4,  null, true, "Bakım & Sağlık",         "kemirgen-bakim-saglik",       "2026-04-05 15:31:46.712490", 5,    "🚿"},
            {47, "2026-04-05 15:31:46.872884", null, 1,  null, true, "Sürüngen Yemi",          "surungenler-yemi",            "2026-04-05 15:31:46.872884", 6,    "🍃"},
            {48, "2026-04-05 15:31:46.872884", null, 2,  null, true, "Aksesuarlar",            "surungenler-aksesuarlar",     "2026-04-05 15:31:46.872884", 6,    "🎒"},
            {49, "2026-04-05 15:31:46.872884", null, 3,  null, true, "Taban Malzemeleri",      "surungenler-taban-malzemeleri","2026-04-05 15:31:46.872884", 6,   "🪵"},
            {58, "2026-04-08 14:45:32.607330", null, 1,  null, true, "Kedi Maması",            "kedi-mamasi",                 "2026-04-08 14:45:32.607330", 1,    "🐱"},
            {59, "2026-04-08 14:45:32.607330", null, 1,  null, true, "Köpek Maması",           "kopek-mamasi",                "2026-04-08 14:45:32.607330", 2,    "🐶"},
            {60, "2026-04-08 14:45:32.607330", null, 1,  null, true, "Kedi Aksesuarı",         "kedi-aksesuari",              "2026-04-08 14:45:32.607330", 1,    "😺"},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} kategori eklendi.", rows.length);
    }

    // ── Brands ────────────────────────────────────────────────────────────────

    private void seedBrands() {
        String sql = "INSERT INTO petshop.brands (id, created_at, is_active, logo_url, name, slug, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {6, "2026-04-08 14:45:51.775615", true, null, "Royal Canin", "royal-canin", "2026-04-08 14:45:51.775615"},
            {7, "2026-04-08 14:45:51.775615", true, null, "Pro Plan",    "pro-plan",    "2026-04-08 14:45:51.775615"},
            {8, "2026-04-08 14:45:51.775615", true, null, "Brit Care",   "brit-care",   "2026-04-08 14:45:51.775615"},
            {9, "2026-04-08 14:45:51.775615", true, null, "N&D",         "nd",          "2026-04-08 14:45:51.775615"},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} marka eklendi.", rows.length);
    }

    // ── Campaigns ─────────────────────────────────────────────────────────────

    private void seedCampaigns() {
        String sql = "INSERT INTO petshop.campaigns " +
                "(id, badge, bg_color, created_at, description, emoji, end_date, is_active, start_date, sticker, title) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {3, "🚚 Ücretsiz Kargo", "linear-gradient(135deg,#1e3a5f,#0a1628)", "2026-04-07 18:59:07.797300",
             "Tüm siparişlerinizde 750 ₺ ve üzeri alımlarda ücretsiz hızlı kargo. Türkiye genelinde geçerli.",
             "🚚", null, true, null, null, "750 ₺ Üzeri\nÜcretsiz Kargo"},
            {4, "🏷️ Toptan Fiyat", "linear-gradient(135deg,#dc2626,#7f1d1d)", "2026-04-07 18:59:07.797300",
             "Kayıtlı üyelerimize özel toptan fiyat avantajı. Tüm kategorilerde geçerli indirimli fiyatlar sizi bekliyor.",
             "🐾", null, true, null, "Üyelere Özel", "Toptan Alımlarda\nÖzel Fiyatlar!"},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} kampanya eklendi.", rows.length);
    }

    // ── Products ──────────────────────────────────────────────────────────────

    private void seedProducts() {
        String sql = "INSERT INTO petshop.products " +
                "(id, base_price, created_at, description, is_active, is_featured, moq, name, review_count, " +
                "short_description, sku, slug, stock_quantity, unit, updated_at, vat_rate, weight, brand_id, category_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {2,  577.50,  "2026-04-08 14:45:52.277254", "Poodle ırkına özel tüy sağlığı destekleyici yetişkin köpek konservesi, 12x85gr",  true, true, 1, "Royal Canin Poodle Tüy Sağlığı Destekleyici Yetişkin Köpek Konservesi 12x85gr",             0, "Poodle ırkına özel tüy sağlığı destekleyici yetişkin köpek konservesi, 12x85gr",  "SKU-CD3E60CD", "royal-canin-poodle-tuy-sagligi-destekleyici-yetiskin-kopek-konservesi-12x85gr",                              100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 59},
            {3,  572.00,  "2026-04-08 14:45:52.277254", "Duyusal koku deneyimi sunan yaş kedi maması, 12x85gr",                             true, true, 1, "Royal Canin Sensory Smell Pouch Yaş Kedi Maması 12x85 Gr",                                  0, "Duyusal koku deneyimi sunan yaş kedi maması, 12x85gr",                             "SKU-58A800C7", "royal-canin-sensory-smell-pouch-yas-kedi-mamasi-12x85-gr",                                                   100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 58},
            {4,  605.00,  "2026-04-08 14:45:52.277254", "Jöle içinde instinktif formül yaş kedi maması, 12x85gr",                           true, true, 1, "Royal Canin Jelly Instinctive Yaş Kedi Maması 12x85 Gr",                                    0, "Jöle içinde instinktif formül yaş kedi maması, 12x85gr",                           "SKU-F742A1CD", "royal-canin-jelly-instinctive-yas-kedi-mamasi-12x85-gr",                                                     100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 58},
            {5,  660.00,  "2026-04-08 14:45:52.277254", "Kilo kontrolü için diyet yaş kedi maması, 12x85gr",                                true, true, 1, "Royal Canin Gravy Light Weight Diyet Yaş Kedi Maması 12x85gr",                             0, "Kilo kontrolü için diyet yaş kedi maması, 12x85gr",                                "SKU-DC522E2A", "royal-canin-gravy-light-weight-diyet-yas-kedi-mamasi-12x85gr",                                               100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 58},
            {6,  165.00,  "2026-04-08 14:45:52.277254", "Orta ırklar için yetişkin köpek konservesi, 410gr",                                true, true, 1, "Royal Canin Medium Adult Orta Irk Köpek Konservesi 410 Gr",                                 0, "Orta ırklar için yetişkin köpek konservesi, 410gr",                                "SKU-AFA66CA5", "royal-canin-medium-adult-orta-irk-kopek-konservesi-410-gr",                                                  100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 59},
            {7,  105.00,  "2026-04-08 14:45:52.277254", "Küçük ırklar için yetişkin köpek konservesi, 195gr",                               true, true, 1, "Royal Canin Mini Adult Küçük Irk Köpek Konservesi 195 Gr",                                  0, "Küçük ırklar için yetişkin köpek konservesi, 195gr",                               "SKU-9A693312", "royal-canin-mini-adult-kucuk-irk-kopek-konservesi-195-gr",                                                   100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 59},
            {8,  6555.00, "2026-04-08 14:45:52.277254", "Kısırlaştırılmış kediler için özel formül kuru mama, 2kg x6",                      true, true, 1, "Royal Canin Sterilised 37 Kısırlaştırılmış Kedi Maması 2 Kg 6 Adet",                       0, "Kısırlaştırılmış kediler için özel formül kuru mama, 2kg x6",                      "SKU-FCDE680B", "royal-canin-sterilised-37-kisirlastirilmis-kedi-mamasi-2-kg-6-adet",                                         100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 58},
            {9,  605.00,  "2026-04-08 14:45:52.277254", "Kısırlaştırılmış kediler için sos içinde yaş mama, 12x85gr",                       true, true, 1, "Royal Canin Gravy Sterilised Kısırlaştırılmış Yaş Kedi Maması 12x85 Gr",                   0, "Kısırlaştırılmış kediler için sos içinde yaş mama, 12x85gr",                       "SKU-5AEFB091", "royal-canin-gravy-sterilised-kisirlastirilmis-yas-kedi-mamasi-12x85-gr",                                     100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 58},
            {10, 725.00,  "2026-04-08 14:45:52.277254", "İç mekanda yaşayan küçük ırk yetişkin köpekler için, 1.5kg",                       true, true, 1, "Royal Canin Mini Indoor Adult Yetişkin Köpek Maması 1.5 Kg",                                0, "İç mekanda yaşayan küçük ırk yetişkin köpekler için, 1.5kg",                       "SKU-4AE75A48", "royal-canin-mini-indoor-adult-yetiskin-kopek-mamasi-15-kg",                                                  100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 6, 59},
            {11, 580.00,  "2026-04-08 14:45:52.277254", "Kediler için su alımını destekleyici tavuklu besin takviyesi, 10x75gr",             true, true, 1, "ProPlan Hydra Care Kediler İçin Su Alımını Destekleyici Tavuklu Besin Takviyesi 10x75gr",  0, "Kediler için su alımını destekleyici tavuklu besin takviyesi, 10x75gr",             "SKU-BA40F066", "proplan-hydra-care-kediler-icin-su-alimini-destekleyici-tavuklu-besin-takviyesi-",                             100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 58},
            {12, 5100.00, "2026-04-08 14:45:52.277254", "Böbrek sağlığı için somonlu kısırlaştırılmış kedi maması, 14kg",                   true, true, 1, "Pro Plan Renal Somonlu Kısırlaştırılmış Kedi Maması 14 Kg",                                 0, "Böbrek sağlığı için somonlu kısırlaştırılmış kedi maması, 14kg",                   "SKU-A69A3B68", "pro-plan-renal-somonlu-kisirlastirilmis-kedi-mamasi-14-kg",                                                  100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 58},
            {13, 2399.00, "2026-04-08 14:45:52.277254", "Küçük ırk yetişkin köpekler için kuzu etli mama, 7kg",                             true, true, 1, "Pro Plan Small-Mini Adult Kuzu Etli Köpek Maması 7 kg",                                     0, "Küçük ırk yetişkin köpekler için kuzu etli mama, 7kg",                             "SKU-6F67B88C", "pro-plan-small-mini-adult-kuzu-etli-kopek-mamasi-7-kg",                                                      100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 59},
            {14, 200.00,  "2026-04-08 14:45:52.277254", "Jöle içinde balıklı yetişkin köpek konservesi, 400gr",                             true, true, 1, "ProPlan Jelly Balıklı Yetişkin Köpek Konservesi 400gr",                                    0, "Jöle içinde balıklı yetişkin köpek konservesi, 400gr",                             "SKU-2E4E3D8E", "proplan-jelly-balikli-yetiskin-kopek-konservesi-400gr",                                                       100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 59},
            {15, 3384.00, "2026-04-08 14:45:52.277254", "Hassas sindirim sistemine sahip köpekler için somonlu mama, 10kg",                  true, true, 1, "Pro Plan Sensitive Adult Somonlu Yetişkin Köpek Maması 10kg",                               0, "Hassas sindirim sistemine sahip köpekler için somonlu mama, 10kg",                  "SKU-6A322EB7", "pro-plan-sensitive-adult-somonlu-yetiskin-kopek-mamasi-10kg",                                                100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 59},
            {16, 46.75,   "2026-04-08 14:45:52.277254", "Yavru kediler için tavuklu konserve mama, 85gr",                                   true, true, 1, "ProPlan Baby Kitten Tavuklu Yavru Kedi Konservesi 85gr",                                    0, "Yavru kediler için tavuklu konserve mama, 85gr",                                   "SKU-3139C25E", "proplan-baby-kitten-tavuklu-yavru-kedi-konservesi-85gr",                                                     100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 58},
            {17, 3350.00, "2026-04-08 14:45:52.277254", "Alerjen azaltan hindili kısırlaştırılmış kedi maması, 7kg",                        true, true, 1, "Pro Plan LiveClear Hindili Alerjen Azaltan Kısırlaştırılmış Kedi Maması 7kg",               0, "Alerjen azaltan hindili kısırlaştırılmış kedi maması, 7kg",                        "SKU-7593E507", "pro-plan-liveclear-hindili-alerjen-azaltan-kisirlastirilmis-kedi-mamasi-7kg",                                 100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 58},
            {18, 4324.00, "2026-04-08 14:45:52.277254", "Orta ırk yetişkin köpekler için tavuklu mama, 16.5kg",                             true, true, 1, "ProPlan Medium Adult Tavuklu Yetişkin Köpek Maması 16.5 Kg",                               0, "Orta ırk yetişkin köpekler için tavuklu mama, 16.5kg",                             "SKU-9FB7184C", "proplan-medium-adult-tavuklu-yetiskin-kopek-mamasi-165-kg",                                                  100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 59},
            {19, 1524.00, "2026-04-08 14:45:52.277254", "Hassas deri ve tüy yumağı kontrolü için kedi maması, 3kg",                         true, true, 1, "Pro Plan Elegant Hassas Deri ve Hairball Kedi Maması 3 Kg",                                 0, "Hassas deri ve tüy yumağı kontrolü için kedi maması, 3kg",                         "SKU-408AAAD8", "pro-plan-elegant-hassas-deri-ve-hairball-kedi-mamasi-3-kg",                                                  100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 7, 58},
            {20, 1500.00, "2026-04-08 14:45:52.277254", "Karidesli ve hindili küçük ırk yetişkin köpek maması, 2kg",                        true, true, 1, "Brit Care Mini Raw Delights Karidesli ve Hindili Küçük Irk Yetişkin Köpek Maması 2 Kg",   0, "Karidesli ve hindili küçük ırk yetişkin köpek maması, 2kg",                        "SKU-3CBA65EA", "brit-care-mini-raw-delights-karidesli-ve-hindili-kucuk-irk-yetiskin-kopek-mamasi", 100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 59},
            {21, 1305.00, "2026-04-08 14:45:52.277254", "Tahılsız ördekli ve hindili kısırlaştırılmış kedi maması, 2kg",                    true, true, 1, "Brit Care Sterilised Ördek ve Hindi Tahılsız Kısırlaştırılmış Kedi Maması 2 Kg",          0, "Tahılsız ördekli ve hindili kısırlaştırılmış kedi maması, 2kg",                    "SKU-16D59AA7", "brit-care-sterilised-ordek-ve-hindi-tahilsiz-kisirlastirilmis-kedi-mamasi-2-kg",                              100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 58},
            {22, 4785.00, "2026-04-08 14:45:52.277254", "Tahılsız somonlu ve patatesli yavru köpek maması, 12kg",                           true, true, 1, "Brit Care Tahılsız Somonlu ve Patatesli Yavru Köpek Maması 12kg",                          0, "Tahılsız somonlu ve patatesli yavru köpek maması, 12kg",                           "SKU-4ABE1DCF", "brit-care-tahilsiz-somonlu-ve-patatesli-yavru-kopek-mamasi-12kg",                                           100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 59},
            {23, 148.50,  "2026-04-08 14:45:52.277254", "İdrar yolu sağlığı için kedi ödülü, 50gr",                                         true, true, 1, "Brit Care Urinary Kedi Ödülü 50gr",                                                        0, "İdrar yolu sağlığı için kedi ödülü, 50gr",                                         "SKU-0CDF103D", "brit-care-urinary-kedi-odulu-50gr",                                                                         100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 60},
            {24, 5227.00, "2026-04-08 14:45:52.277254", "Sindirim ve deri sağlığı için geyik etli yetişkin köpek maması, 12kg",              true, true, 1, "Brit Sensitive Tahılsız Digestion-Skin Geyik Etli Yetişkin Köpek Maması 12 Kg",           0, "Sindirim ve deri sağlığı için geyik etli yetişkin köpek maması, 12kg",              "SKU-2E3E922A", "brit-sensitive-tahilsiz-digestion-skin-geyik-etli-yetiskin-kopek-mamasi-12-kg",                              100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 59},
            {25, 1530.00, "2026-04-08 14:45:52.277254", "Yaşlı köpekler için kuzu etli hipoalerjenik mama, 3kg",                            true, true, 1, "Brit Care Hypo Senior Kuzu Etli Yaşlı Köpek Maması 3 Kg",                                  0, "Yaşlı köpekler için kuzu etli hipoalerjenik mama, 3kg",                            "SKU-ED42ECDB", "brit-care-hypo-senior-kuzu-etli-yasli-kopek-mamasi-3-kg",                                                    100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 59},
            {26, 1350.00, "2026-04-08 14:45:52.277254", "Tahılsız bağışıklık destekleyici kısırlaştırılmış kedi maması, 2kg",               true, true, 1, "Brit Care Grain-Free Sterilized Immunity Support Kısırlaştırılmış Kedi Maması 2kg",       0, "Tahılsız bağışıklık destekleyici kısırlaştırılmış kedi maması, 2kg",               "SKU-200E7CB6", "brit-care-grain-free-sterilized-immunity-support-kisirlastirilmis-kedi-mamasi-2k",                             100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 58},
            {27, 1530.00, "2026-04-08 14:45:52.277254", "Hassas sindirimli küçük ırk köpekler için geyik etli mama, 2kg",                   true, true, 1, "Brit Care Mini Sensitive Geyik Etli Yetişkin Köpek Maması 2 Kg",                           0, "Hassas sindirimli küçük ırk köpekler için geyik etli mama, 2kg",                   "SKU-B21E2217", "brit-care-mini-sensitive-geyik-etli-yetiskin-kopek-mamasi-2-kg",                                             100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 8, 59},
            {28, 850.00,  "2026-04-08 14:45:52.277254", "Tropikal meyveli kuzu etli yavru kedi maması, 1.5kg",                              true, true, 1, "N&D Tropical Kuzu Etli Yavru Kedi Maması 1.5kg",                                           0, "Tropikal meyveli kuzu etli yavru kedi maması, 1.5kg",                              "SKU-85FF439E", "nd-tropical-kuzu-etli-yavru-kedi-mamasi-15kg",                                                              100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 9, 58},
            {29, 2160.00, "2026-04-08 14:45:52.277254", "Tavuklu ve tropikal meyveli yetişkin kedi maması, 4kg+1kg hediyeli",               true, true, 1, "N&D Tropical Selection Tavuklu Yetişkin Kedi Maması 4kg 1kg Hediyeli",                     0, "Tavuklu ve tropikal meyveli yetişkin kedi maması, 4kg+1kg hediyeli",               "SKU-6610304A", "nd-tropical-selection-tavuklu-yetiskin-kedi-mamasi-4kg-1kg-hediyeli",                                       100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 9, 58},
            {30, 2625.00, "2026-04-08 14:45:52.277254", "Az tahıllı morina balıklı ve portakallı küçük ırk köpek maması, 7kg",              true, true, 1, "N&D Ocean Az Tahıllı Morina Balıklı Portakallı Küçük Irk Yetişkin Köpek Maması 7 Kg",    0, "Az tahıllı morina balıklı ve portakallı küçük ırk köpek maması, 7kg",              "SKU-4B121479", "nd-ocean-az-tahilli-morina-balikli-portakalli-kucuk-irk-yetiskin-kopek-mamasi-7-", 100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 9, 59},
            {31, 3780.00, "2026-04-08 14:45:52.277254", "Tropikal meyveli tavuklu kısırlaştırılmış kedi maması, 10kg",                      true, true, 1, "N&D Tropical Tavuklu Kısırlaştırılmış Kedi Maması 10 KG",                                   0, "Tropikal meyveli tavuklu kısırlaştırılmış kedi maması, 10kg",                      "SKU-3E498457", "nd-tropical-tavuklu-kisirlastirilmis-kedi-mamasi-10-kg",                                                     100, "adet", "2026-04-08 14:45:52.277254", 20.00, 1.000, 9, 58},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} ürün eklendi.", rows.length);
    }

    // ── Product Images ────────────────────────────────────────────────────────

    private void seedProductImages() {
        String sql = "INSERT INTO petshop.product_images " +
                "(id, created_at, display_order, image_url, is_primary, product_id) " +
                "VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {1,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701364/products/hpq8xjjvn0a9samrzc1w.webp", true,  2},
            {2,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701366/products/ccjrmiu27vcpd8dnxphh.webp", true,  3},
            {3,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701367/products/jrwuxhq2ixuwlbndmxke.webp", true,  4},
            {4,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701368/products/erewcmgwmqhlmoi0wv3h.webp", true,  5},
            {5,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701370/products/aczlgght2hytaejywac1.webp", true,  6},
            {6,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701371/products/od7ia8w5avlut4mo6zfj.webp", true,  7},
            {7,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701372/products/qkzirpbonbctdd7tmkna.webp", true,  8},
            {8,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701374/products/vgtdgxpidmt2aftflxks.webp", true,  9},
            {9,  "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701375/products/ssjfwr6pmafnswh4szbb.webp", true,  10},
            {10, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701376/products/zp9tceyvq477dsrb2fi7.webp", true,  11},
            {11, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701377/products/ss6vljq72zzn8o9rpvmm.webp", true,  12},
            {12, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701379/products/qilwicljxsudlonvoqry.webp", true,  13},
            {13, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701381/products/ja2sqcwulzijb2892c7e.webp", true,  14},
            {14, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701382/products/cxnevxoe1b8xlemuttum.webp", true,  15},
            {15, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701384/products/gcnak8vciu23q9j7wgo2.webp", true,  16},
            {16, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701385/products/s2mpk9ehb41cza70avji.webp", true,  17},
            {17, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701386/products/ncjp69u3hecrrujmisha.webp", true,  18},
            {18, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701387/products/e29zaxbzqq1qnfqt9ixp.webp", true,  19},
            {19, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701389/products/zneol9avd484jqowcmbv.webp", true,  20},
            {20, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701390/products/nquayjox3xlg96f8rslh.jpg",  true,  21},
            {21, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701391/products/ldch57hjdhxgge0vkkxu.webp", true,  22},
            {22, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701393/products/t1zkuvtjscvnb9gzybdv.webp", true,  23},
            {23, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701394/products/oed9obdrzdoto6fszlga.webp", true,  24},
            {24, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701395/products/faqocadlgk2gkxatyfsz.webp", true,  25},
            {25, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701397/products/uny15q7coajghy860byo.webp", true,  26},
            {26, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701398/products/doyskv9ytxbpbddtbtoz.webp", true,  27},
            {27, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701399/products/h5cjbm9eoxobjpsvqfmn.webp", true,  28},
            {28, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701400/products/ox7sjs6cms56mvfmuhx3.webp", true,  29},
            {29, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701402/products/u7yd72jv5sdldm9837ob.webp", true,  30},
            {30, "2026-04-08 14:45:52.277254", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775701403/products/egzzjwdeh1yeip4lurgt.webp", true,  31},
            {31, "2026-04-09 06:07:44.049257", 1, "https://res.cloudinary.com/dotcw6tty/image/upload/v1775704063/products/eieltn4rq36klqegamv2.png",  false, 2},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} ürün görseli eklendi.", rows.length);
    }

    // ── Category Discounts ────────────────────────────────────────────────────

    private void seedCategoryDiscounts() {
        String sql = "INSERT INTO petshop.category_discounts " +
                "(id, created_at, discount_type, discount_value, end_date, is_active, name, start_date, category_id, emoji) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING";

        Object[][] rows = {
            {2, "2026-04-08 16:09:09.973335", "PERCENT", 60.00,
             "2026-05-10 19:09:00.000000", true, "66",
             "2026-04-08 19:08:00.000000", 59, "🎁"},
        };

        for (Object[] row : rows) {
            jdbc.update(sql, row);
        }
        log.info("DataSeeder: {} kategori indirimi eklendi.", rows.length);
    }
}
