-- V4: Tenant API anahtarları (webhook + 3rd party entegrasyon için)

CREATE TABLE IF NOT EXISTS petshop.api_keys (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES petshop.companies(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,         -- "Zapier", "POS Cihazı", vb
  prefix      VARCHAR(10) NOT NULL,           -- "pt_live_" veya "pt_test_"
  key_hash    VARCHAR(128) NOT NULL UNIQUE,   -- SHA-256(plaintext)
  last_four   VARCHAR(8)  NOT NULL,           -- son 4 karakter — UI'da göstermek için
  scopes      VARCHAR(500),                   -- virgülle ayrılmış: "products:read,sales:write"
  last_used_at TIMESTAMP,
  revoked_at  TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_company  ON petshop.api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash     ON petshop.api_keys(key_hash);
