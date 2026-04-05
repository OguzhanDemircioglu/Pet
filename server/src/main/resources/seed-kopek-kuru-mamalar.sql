-- ============================================================
-- offcats — Köpek Kuru Mamaları Ürün Seed Data
-- Kaynak: offcats.com (30 ürün, ilk sayfa)
-- Notlar:
--   - base_price değerleri offcats.com indirimli fiyatlarıdır (KDV dahil/hariç kontrol et)
--   - image_url alanları geçici placeholder — gerçek görselleri uploads/products/ altına yükle
--   - stock_quantity varsayılan: 100 (admin güncelleyecek)
--   - moq varsayılan: 1
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. MARKALAR
-- ─────────────────────────────────────────────
INSERT INTO petshop.brands (name, slug, is_active, created_at)
VALUES
  ('Caviara',         'caviara',         true, NOW()),
  ('Reflex',          'reflex',          true, NOW()),
  ('Enjoy',           'enjoy',           true, NOW()),
  ('Wanpy',           'wanpy',           true, NOW()),
  ('Pro Performance', 'pro-performance', true, NOW()),
  ('Loi',             'loi',             true, NOW()),
  ('Brit Care',       'brit-care',       true, NOW()),
  ('Brit Premium',    'brit-premium',    true, NOW()),
  ('Hills',           'hills',           true, NOW()),
  ('Royal Canin',     'royal-canin',     true, NOW()),
  ('N&D',             'nd',              true, NOW()),
  ('Advance',         'advance',         true, NOW()),
  ('Pro Plan',        'pro-plan',        true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. KATEGORİLER: Köpek > Kuru Mamalar > Alt Kategoriler
-- ─────────────────────────────────────────────
INSERT INTO petshop.categories (name, slug, description, parent_id, display_order, is_active, created_at)
SELECT 'Kuru Mamalar', 'kopek-kuru-mamalar', 'Köpek kuru mamaları',
       (SELECT id FROM petshop.categories WHERE slug = 'kopek'),
       1, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM petshop.categories WHERE slug = 'kopek-kuru-mamalar');

INSERT INTO petshop.categories (name, slug, description, parent_id, display_order, is_active, created_at)
SELECT 'Yetişkin Köpek Mamaları', 'yetiskin-kopek-mamasi', 'Yetişkin köpek kuru mamaları',
       (SELECT id FROM petshop.categories WHERE slug = 'kopek-kuru-mamalar'),
       1, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi');

INSERT INTO petshop.categories (name, slug, description, parent_id, display_order, is_active, created_at)
SELECT 'Yavru Köpek Mamaları', 'yavru-kopek-mamasi', 'Yavru köpek kuru mamaları',
       (SELECT id FROM petshop.categories WHERE slug = 'kopek-kuru-mamalar'),
       2, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi');

INSERT INTO petshop.categories (name, slug, description, parent_id, display_order, is_active, created_at)
SELECT 'Yaşlı Köpek Mamaları', 'yasli-kopek-mamasi', 'Yaşlı köpek kuru mamaları',
       (SELECT id FROM petshop.categories WHERE slug = 'kopek-kuru-mamalar'),
       3, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM petshop.categories WHERE slug = 'yasli-kopek-mamasi');

-- ─────────────────────────────────────────────
-- 3. ÜRÜNLER
-- Sütunlar: name, slug, sku, category_id, brand_id, base_price, vat_rate,
--           moq, stock_quantity, reserved_quantity, unit, weight_kg,
--           is_active, is_featured, created_at
-- ─────────────────────────────────────────────

-- 1. Caviara Kuzu Etli Orta Ve Büyük Irk — 2 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Caviara Kuzu Etli Orta Ve Büyük Irk Köpek Maması 2 Kg',
       'caviara-kuzu-etli-orta-ve-buyuk-irk-kopek-mamasi-2-kg',
       'PT-KKM-001',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'caviara'),
       880.00, 20.00, 1, 100, 0, 'adet', 2.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 2. Caviara Hipoalerjenic Somonlu Büyük Irk Yetişkin — 2 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Caviara Hipoalerjenic Somonlu Büyük Irk Yetişkin Köpek Maması 2 Kg',
       'caviara-hipoalerjenic-somonlu-buyuk-irk-yetiskin-kopek-mamasi-2-kg',
       'PT-KKM-002',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'caviara'),
       990.00, 20.00, 1, 100, 0, 'adet', 2.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 3. Caviara Tavuklu Mini Küçük Irk Yetişkin — 2 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Caviara Tavuklu Mini Küçük Irk Yetişkin Köpek Maması 2 Kg',
       'caviara-tavuklu-mini-kucuk-irk-yetiskin-kopek-mamasi-2-kg',
       'PT-KKM-003',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'caviara'),
       780.00, 20.00, 1, 100, 0, 'adet', 2.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 4. Caviara Kuzu Etli Ve Pirinçli Büyük Irk Yetişkin — 12 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Caviara Kuzu Etli Ve Pirinçli Büyük Irk Yetişkin Köpek Maması 12 Kg',
       'caviara-kuzu-etli-ve-pirincli-buyuk-irk-yetiskin-kopek-mamasi-12-kg',
       'PT-KKM-004',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'caviara'),
       3600.00, 20.00, 1, 100, 0, 'adet', 12.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 5. Reflex Duo Protein Somonlu ve Kuzu Etli Orta Irk Yetişkin — 10 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Reflex Duo Protein Somonlu ve Kuzu Etli Orta Irk Yetişkin Köpek Maması 10 Kg',
       'reflex-duo-protein-somonlu-ve-kuzu-etli-orta-irk-yetiskin-kopek-mamasi-10-kg',
       'PT-KKM-005',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'reflex'),
       1620.00, 20.00, 1, 100, 0, 'adet', 10.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 6. Enjoy Biftekli Yetişkin — 15 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Enjoy Biftekli Yetişkin Köpek Maması 15 Kg',
       'enjoy-biftekli-yetiskin-kopek-mamasi-15-kg',
       'PT-KKM-006',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'enjoy'),
       905.00, 20.00, 1, 100, 0, 'adet', 15.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 7. Wanpy Tahılsız Tavuklu Yetişkin — 1,5 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Wanpy Tahılsız Tavuklu Yetişkin Köpek Maması 1,5 Kg',
       'wanpy-tahilsiz-tavuklu-yetiskin-kopek-mamasi-1-5-kg',
       'PT-KKM-007',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'wanpy'),
       747.00, 20.00, 1, 100, 0, 'adet', 1.500, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 8. Wanpy Tahılsız Ördekli Yetişkin — 1,5 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Wanpy Tahılsız Ördekli Yetişkin Köpek Maması 1,5 Kg',
       'wanpy-tahilsiz-ordekli-yetiskin-kopek-mamasi-1-5-kg',
       'PT-KKM-008',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'wanpy'),
       747.00, 20.00, 1, 100, 0, 'adet', 1.500, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 9. Pro Performance Kuzu Etli ve Yaban Mersinli Küçük Irk — 7 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Pro Performance Kuzu Etli ve Yaban Mersinli Küçük Irk Köpek Maması 7 Kg',
       'pro-performance-kuzu-etli-ve-yaban-mersinli-kucuk-irk-kopek-mamasi-7-kg',
       'PT-KKM-009',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'pro-performance'),
       2111.00, 20.00, 1, 100, 0, 'adet', 7.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 10. Loi Hipoalerjenik Somonlu Yetişkin — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Loi Hipoalerjenik Somonlu Yetişkin Köpek Maması 3 Kg',
       'loi-hipoalerjenik-somonlu-yetiskin-kopek-mamasi-3-kg',
       'PT-KKM-010',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'loi'),
       688.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 11. Loi Hipoalerjenik Kuzu Etli Yavru — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Loi Hipoalerjenik Kuzu Etli Yavru Köpek Maması 3 Kg',
       'loi-hipoalerjenik-kuzu-etli-yavru-kopek-mamasi-3-kg',
       'PT-KKM-011',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'loi'),
       737.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 12. Loi Hipoalerjenik Küçük Irk Yavru — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Loi Hipoalerjenik Küçük Irk Yavru Köpek Maması Kuzu Etli 3 Kg',
       'loi-hipoalerjenik-kucuk-irk-yavru-kopek-mamasi-kuzu-etli-3-kg',
       'PT-KKM-012',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'loi'),
       752.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 13. Loi Hipoalerjenik Yavru Kuzu Etli — 15 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Loi Hipoalerjenik Yavru Kuzu Etli Köpek Maması 15 Kg',
       'loi-hipoalerjenik-yavru-kuzu-etli-kopek-mamasi-15-kg',
       'PT-KKM-013',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'loi'),
       2621.00, 20.00, 1, 100, 0, 'adet', 15.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 14. Brit Care Grain Free Puppy Tahılsız Somonlu — 12 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Brit Care Grain Free Puppy Tüm Irklar İçin Tahılsız Somonlu Yavru Köpek Maması 12 Kg',
       'brit-care-grain-free-puppy-tum-irklar-icin-tahilsiz-somonlu-yavru-kopek-mamasi-12-kg',
       'PT-KKM-014',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'brit-care'),
       4562.00, 20.00, 1, 100, 0, 'adet', 12.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 15. Hills Lamb Rice Büyük Irk Yetişkin — 14 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Lamb Rice Kuzu Etli Büyük Irk Yetişkin Köpek Maması 14 Kg',
       'hills-lamb-rice-kuzu-etli-buyuk-irk-yetiskin-kopek-mamasi-14-kg',
       'PT-KKM-015',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       5360.00, 20.00, 1, 100, 0, 'adet', 14.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 16. Hills Puppy Kuzu Etli Yavru — 14 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Puppy Kuzu Etli Yavru Köpek Maması 14 Kg',
       'hills-puppy-kuzu-etli-yavru-kopek-mamasi-14-kg',
       'PT-KKM-016',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       5672.00, 20.00, 1, 100, 0, 'adet', 14.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 17. Hills Mature +7 Lamb Yaşlı — 14 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Mature +7 Lamb Kuzu Etli Yaşlı Köpek Maması 14 Kg',
       'hills-mature-7-lamb-kuzu-etli-yasli-kopek-mamasi-14-kg',
       'PT-KKM-017',
       (SELECT id FROM petshop.categories WHERE slug = 'yasli-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       5269.00, 20.00, 1, 100, 0, 'adet', 14.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 18. Hills Small & Miniature Puppy Küçük Irk — 6 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Small & Miniature Puppy Küçük Irk Kuzulu Yavru Köpek Maması 6 Kg',
       'hills-small-miniature-puppy-kucuk-irk-kuzulu-yavru-kopek-mamasi-6-kg',
       'PT-KKM-018',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       3526.00, 20.00, 1, 100, 0, 'adet', 6.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 19. Hills Small Mini Sensitive Küçük Irk — 1,5 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Small Mini Sensitive Küçük Irk Köpek Maması 1,5 Kg',
       'hills-small-mini-sensitive-kucuk-irk-kopek-mamasi-1-5-kg',
       'PT-KKM-019',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       1232.00, 20.00, 1, 100, 0, 'adet', 1.500, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 20. Hills Small & Miniature Puppy Küçük Irk — 1,5 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Hills Small & Miniature Puppy Küçük Irk Kuzulu Yavru Köpek Maması 1,5 Kg',
       'hills-small-miniature-puppy-kucuk-irk-kuzulu-yavru-kopek-mamasi-1-5-kg',
       'PT-KKM-020',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'hills'),
       1130.00, 20.00, 1, 100, 0, 'adet', 1.500, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 21. Royal Canin X-Small Puppy — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Royal Canin X-Small Puppy Küçük Irk Yavru Köpek Maması 3 Kg',
       'royal-canin-x-small-puppy-kucuk-irk-yavru-kopek-mamasi-3-kg',
       'PT-KKM-021',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'royal-canin'),
       1756.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 22. Royal Canin X-Small Yetişkin — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Royal Canin X-Small Küçük Irk Köpek Maması 3 Kg',
       'royal-canin-x-small-kucuk-irk-kopek-mamasi-3-kg',
       'PT-KKM-022',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'royal-canin'),
       1756.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 23. N&D Ocean Balıklı Küçük Irk Tahılsız Yetişkin — 7 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'N&D Ocean Balıklı Küçük Irk Tahılsız Yetişkin Köpek Maması 7 Kg',
       'nd-ocean-balikli-kucuk-irk-tahilsiz-yetiskin-kopek-mamasi-7-kg',
       'PT-KKM-023',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'nd'),
       3582.00, 20.00, 1, 100, 0, 'adet', 7.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 24. N&D Az Tahıllı Tavuklu Yetişkin Medium Maxi — 12+3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'N&D Az Tahıllı Tavuklu Yetişkin Medium Maxi Köpek Maması 12+3 Kg',
       'nd-az-tahilli-tavuklu-yetiskin-medium-maxi-kopek-mamasi-12-3-kg',
       'PT-KKM-024',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'nd'),
       4130.00, 20.00, 1, 100, 0, 'adet', 15.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 25. Advance Tavuklu Orta Irk Yavru — 3 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Advance Tavuklu Orta Irk Yavru Köpek Maması 3 Kg',
       'advance-tavuklu-orta-irk-yavru-kopek-mamasi-3-kg',
       'PT-KKM-025',
       (SELECT id FROM petshop.categories WHERE slug = 'yavru-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'advance'),
       1450.00, 20.00, 1, 100, 0, 'adet', 3.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 26. Royal Canin Maxi Dermacomfort Yetişkin — 12 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Royal Canin Maxi Dermacomfort Yetişkin Köpek Maması 12 Kg',
       'royal-canin-maxi-dermacomfort-yetiskin-kopek-mamasi-12-kg',
       'PT-KKM-026',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'royal-canin'),
       5949.00, 20.00, 1, 100, 0, 'adet', 12.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 27. Royal Canin Medium Dermacomfort Yetişkin — 12 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Royal Canin Medium Dermacomfort Yetişkin Köpek Maması 12 Kg',
       'royal-canin-medium-dermacomfort-yetiskin-kopek-mamasi-12-kg',
       'PT-KKM-027',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'royal-canin'),
       5949.00, 20.00, 1, 100, 0, 'adet', 12.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 28. Pro Plan Adult Sensitive Somonlu Yetişkin — 14 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Pro Plan Adult Sensitive Somonlu Yetişkin Köpek Maması 14 Kg',
       'proplan-adult-sensitive-somonlu-yetiskin-kopek-mamasi-14-kg',
       'PT-KKM-028',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'pro-plan'),
       4921.00, 20.00, 1, 100, 0, 'adet', 14.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 29. Brit Premium Sensitive Kuzu Etli Yetişkin — 8 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Brit Premium Sensitive Kuzu Etli Yetişkin Köpek Maması 8 Kg',
       'brit-premium-sensitive-kuzu-etli-yetiskin-kopek-mamasi-8-kg',
       'PT-KKM-029',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'brit-premium'),
       2271.00, 20.00, 1, 100, 0, 'adet', 8.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- 30. Enjoy Kuzulu Yetişkin — 15 Kg
INSERT INTO petshop.products
  (name, slug, sku, category_id, brand_id, base_price, vat_rate, moq, stock_quantity, reserved_quantity, unit, weight_kg, is_active, is_featured, created_at)
SELECT 'Enjoy Kuzulu Yetişkin Köpek Maması 15 Kg',
       'enjoy-kuzulu-yetiskin-kopek-mamasi-15-kg',
       'PT-KKM-030',
       (SELECT id FROM petshop.categories WHERE slug = 'yetiskin-kopek-mamasi'),
       (SELECT id FROM petshop.brands WHERE slug = 'enjoy'),
       1399.00, 20.00, 1, 100, 0, 'adet', 15.000, true, false, NOW()
ON CONFLICT (sku) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. ÜRÜN GÖRSELLERİ (Geçici: offcats.com CDN URL'leri)
-- TODO: Görselleri indir → uploads/products/ altına koy → URL'leri güncelle
-- ─────────────────────────────────────────────

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/511/caviara-kuzu-etli-ve-pirincli-orta-ve-buyuk-irk-kopek-mamasi-2-kg-27390_min.jpg',
       true, 0, 'Caviara Kuzu Etli Orta Ve Büyük Irk Köpek Maması 2 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-001'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/508/caviara-hipoalerjenic-somonlu-buyuk-irk-yetiskin-kopek-mamasi-2-kg-27391_min.jpg',
       true, 0, 'Caviara Hipoalerjenic Somonlu Büyük Irk Yetişkin Köpek Maması 2 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-002'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/507/caviara-tavuklu-mini-kucuk-irk-yetiskin-kopek-mamasi-2-kg-27442_min.jpg',
       true, 0, 'Caviara Tavuklu Mini Küçük Irk Yetişkin Köpek Maması 2 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-003'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/463/caviara-kuzu-etli-ve-pirincli-buyuk-irk-yetiskin-kopek-mamasi-12-kg-27300_min.jpg',
       true, 0, 'Caviara Kuzu Etli Ve Pirinçli Büyük Irk Yetişkin Köpek Maması 12 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-004'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/149/reflex-duo-protein-somonlu-ve-kuzu-etli-orta-irk-yetiskin-kopek-mamasi-10-kg-27017_min.jpg',
       true, 0, 'Reflex Duo Protein Somonlu ve Kuzu Etli Orta Irk Yetişkin Köpek Maması 10 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-005'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/527/enjoy-biftekli-yetiskin-kopek-mamasi-15-kg-26752_min.jpg',
       true, 0, 'Enjoy Biftekli Yetişkin Köpek Maması 15 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-006'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/011/wanpy-tahilsiz-tavuklu-yetiskin-kopek-mamasi-1-5-kg-25613_min.jpg',
       true, 0, 'Wanpy Tahılsız Tavuklu Yetişkin Köpek Maması 1,5 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-007'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/006/wanpy-tahilsiz-ordekli-yetiskin-kopek-mamasi-1-5-kg-25582_min.jpg',
       true, 0, 'Wanpy Tahılsız Ördekli Yetişkin Köpek Maması 1,5 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-008'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/999/pro-performance-kuzu-etli-ve-yaban-mersinli-kucuk-irk-kopek-mamasi-7-kg-25569_min.jpg',
       true, 0, 'Pro Performance Kuzu Etli ve Yaban Mersinli Küçük Irk Köpek Maması 7 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-009'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/948/loi-hipoalerjenik-somonlu-yetiskin-kopek-mamasi-3-kg-25275_min.jpg',
       true, 0, 'Loi Hipoalerjenik Somonlu Yetişkin Köpek Maması 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-010'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/947/loi-hipoalerjenik-kuzu-etli-yavru-kopek-mamasi-3-kg-25268_min.jpg',
       true, 0, 'Loi Hipoalerjenik Kuzu Etli Yavru Köpek Maması 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-011'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/946/loi-hipoalerjenik-kucuk-irk-yavru-kopek-mamasi-kuzu-etli-3-kg-25267_min.jpg',
       true, 0, 'Loi Hipoalerjenik Küçük Irk Yavru Köpek Maması Kuzu Etli 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-012'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/933/loi-hipoalerjenik-yavru-kuzu-etli-kopek-mamasi-15-kg-25259_min.jpg',
       true, 0, 'Loi Hipoalerjenik Yavru Kuzu Etli Köpek Maması 15 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-013'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/371/brit-care-puppy-somonlu-tahilsiz-yavru-kopek-mamasi-12kg-21924_min.jpg',
       true, 0, 'Brit Care Grain Free Puppy Tahılsız Somonlu Yavru Köpek Maması 12 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-014'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/550/38_min.jpg',
       true, 0, 'Hills Lamb Rice Kuzu Etli Büyük Irk Yetişkin Köpek Maması 14 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-015'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/428/46_min.jpg',
       true, 0, 'Hills Puppy Kuzu Etli Yavru Köpek Maması 14 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-016'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/427/50_min.jpg',
       true, 0, 'Hills Mature +7 Lamb Kuzu Etli Yaşlı Köpek Maması 14 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-017'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/422/34_min.jpg',
       true, 0, 'Hills Small & Miniature Puppy Küçük Irk Kuzulu Yavru Köpek Maması 6 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-018'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/412/10_min.jpg',
       true, 0, 'Hills Small Mini Sensitive Küçük Irk Köpek Maması 1,5 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-019'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/409/1_min.jpg',
       true, 0, 'Hills Small & Miniature Puppy Küçük Irk Kuzulu Yavru Köpek Maması 1,5 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-020'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/236/royal-canin-x-small-puppy-kucuk-irk-yavru-kopek-mamasi-3-kg-9922-jpg_min.jpg',
       true, 0, 'Royal Canin X-Small Puppy Küçük Irk Yavru Köpek Maması 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-021'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/234/royal-canin-x-small-kucuk-irk-kopek-mamasi-3-kg-9923-jpg_min.jpg',
       true, 0, 'Royal Canin X-Small Küçük Irk Köpek Maması 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-022'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/218/nd-ocean-kopek-ringa-baligi-ve-portakal-yetiskin-mini-7-kg-9793-jpg_min.jpg',
       true, 0, 'N&D Ocean Balıklı Küçük Irk Tahılsız Yetişkin Köpek Maması 7 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-023'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/204/nd-az-tahilli-tavuklu-yetiskin-medium-maxi-kopek-mamasi-12-3-kg-8050-jpeg_min.jpg',
       true, 0, 'N&D Az Tahıllı Tavuklu Yetişkin Medium Maxi Köpek Maması 12+3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-024'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/025/advance-tavuklu-orta-irk-yavru-kopek-mamasi-3-kg-5578-jpg_min.jpg',
       true, 0, 'Advance Tavuklu Orta Irk Yavru Köpek Maması 3 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-025'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/993/royal-canin-maxi-dermacomfort-yetiskin-kopek-mamasi-12-kg-9423-jpeg_min.jpg',
       true, 0, 'Royal Canin Maxi Dermacomfort Yetişkin Köpek Maması 12 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-026'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/992/royal-canin-medium-dermacomfort-yetiskin-kopek-mamasi-12-kg-9417-jpeg_min.jpg',
       true, 0, 'Royal Canin Medium Dermacomfort Yetişkin Köpek Maması 12 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-027'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/953/proplan-adult-sensitive-somonlu-yetiskin-kopek-mamasi-14-kg-24468_min.jpg',
       true, 0, 'Pro Plan Adult Sensitive Somonlu Yetişkin Köpek Maması 14 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-028'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/786/brit-premium-sensitive-kuzu-etli-yetiskin-kopek-mamasi-8-kg-8053-jpg_min.jpg',
       true, 0, 'Brit Premium Sensitive Kuzu Etli Yetişkin Köpek Maması 8 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-029'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);

INSERT INTO petshop.product_images (product_id, image_url, is_primary, display_order, alt_text, created_at)
SELECT p.id,
       'https://www.offcats.com/idea/ql/91/myassets/products/534/enjoy-kuzulu-yetiskin-kopek-mamasi-15-kg-8048-jpg_min.jpg',
       true, 0, 'Enjoy Kuzulu Yetişkin Köpek Maması 15 Kg', NOW()
FROM petshop.products p WHERE p.sku = 'PT-KKM-030'
  AND NOT EXISTS (SELECT 1 FROM petshop.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true);
