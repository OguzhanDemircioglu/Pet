-- V2: audit log tablosu + ek index'ler

CREATE TABLE IF NOT EXISTS petshop.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES petshop.companies(id),
  user_id     BIGINT,                       -- nullable: sistem işlemleri
  action      VARCHAR(50)  NOT NULL,        -- PRODUCT_CREATE, PRODUCT_UPDATE, PRODUCT_DELETE, SALE_CREATE, USER_INVITE, PLAN_CHANGE, ...
  resource_type VARCHAR(50),                -- product, order, user, company
  resource_id BIGINT,
  details     TEXT,                         -- opsiyonel JSON detay
  ip          VARCHAR(64),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_company_created ON petshop.audit_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user            ON petshop.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action          ON petshop.audit_log(action);

-- Performans için ek index'ler (sık sorgular)
CREATE INDEX IF NOT EXISTS idx_products_company_sku  ON petshop.products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_company_created ON petshop.products(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_company_created ON petshop.orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_company_active  ON petshop.users(company_id, is_active);
