-- OffCats - Seed Data
-- Bu dosya yalnızca admin kaydı ve temel seed data içerir.
-- Tablolar JPA (Hibernate ddl-auto:update) tarafından oluşturulur.

-- Şema yoksa oluştur
CREATE SCHEMA IF NOT EXISTS petshop;

-- phone kolonu (yoksa ekle — ddl-auto:update bazen gecikmeli işler)
ALTER TABLE petshop.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- verification_code ve verification_code_expires_at kolonları (eski DB'lerde eksik olabilir)
ALTER TABLE petshop.users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE petshop.users ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP;

-- Tabloda en fazla 1 admin olabilir (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_admin ON petshop.users (role) WHERE role = 'ADMIN';

-- Admin kullanıcısı (şifre: Admin123!)
-- BCrypt hash: $2a$12$q7nWFRHT3qHyRlH2rLX.0eLfQsJv6oCNjFPRt5qJMJUPBN9Kz1mVa
INSERT INTO petshop.users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified, created_at)
VALUES ('admin@offcats.com.tr',
        '$2a$12$q7nWFRHT3qHyRlH2rLX.0eLfQsJv6oCNjFPRt5qJMJUPBN9Kz1mVa',
        'Admin', 'OffCats',
        '05001234567',
        'ADMIN', true, true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Ana kategoriler
INSERT INTO petshop.categories (name, slug, description, parent_id, display_order, is_active, created_at)
VALUES
  ('Kedi',     'kedi',     'Kedi ürünleri',     NULL, 1, true, NOW()),
  ('Köpek',    'kopek',    'Köpek ürünleri',    NULL, 2, true, NOW()),
  ('Kuş',      'kus',      'Kuş ürünleri',      NULL, 3, true, NOW()),
  ('Akvaryum', 'akvaryum', 'Akvaryum ürünleri', NULL, 4, true, NOW()),
  ('Kemirgen', 'kemirgen', 'Kemirgen ürünleri', NULL, 5, true, NOW()),
  ('Sürüngen', 'surungen', 'Sürüngen ürünleri', NULL, 6, true, NOW())
ON CONFLICT (slug) DO NOTHING;
