-- Multi-tenant SaaS dönüşümü
-- Aiven PostgreSQL console'da sırayla çalıştır

-- 1. companies tablosu
CREATE TABLE IF NOT EXISTS petshop.companies (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(100) NOT NULL UNIQUE,
  plan         VARCHAR(20)  NOT NULL DEFAULT 'FREE',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 2. company_id kolonları (nullable başlat)
ALTER TABLE petshop.users    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES petshop.companies(id);
ALTER TABLE petshop.products ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES petshop.companies(id);
ALTER TABLE petshop.orders   ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES petshop.companies(id);

-- 3. Default company + backfill
INSERT INTO petshop.companies (name, slug, plan)
SELECT 'Default', 'default', 'PRO'
WHERE NOT EXISTS (SELECT 1 FROM petshop.companies WHERE slug = 'default');

UPDATE petshop.users    SET company_id = (SELECT id FROM petshop.companies WHERE slug='default') WHERE company_id IS NULL;
UPDATE petshop.products SET company_id = (SELECT id FROM petshop.companies WHERE slug='default') WHERE company_id IS NULL;
UPDATE petshop.orders   SET company_id = (SELECT id FROM petshop.companies WHERE slug='default') WHERE company_id IS NULL;

-- 4. NOT NULL kilidi
ALTER TABLE petshop.users    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE petshop.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE petshop.orders   ALTER COLUMN company_id SET NOT NULL;

-- 5. Index'ler
CREATE INDEX IF NOT EXISTS idx_users_company           ON petshop.users(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company        ON petshop.products(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company          ON petshop.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_active ON petshop.products(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_company_status   ON petshop.orders(company_id, status);

-- 6. SaaS modunda category opsiyonel — minimal ürün için
ALTER TABLE petshop.products ALTER COLUMN category_id DROP NOT NULL;
