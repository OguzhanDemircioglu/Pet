-- V7: Drop legacy e-commerce columns that no entity maps anymore.
--
-- After V6 we relaxed the NOT NULL on products.moq, products.vat_rate,
-- orders.vat_amount and order_items.vat_rate so SaaS inserts wouldn't fail.
-- A schema audit (entity @Column declarations vs information_schema) confirms
-- these four columns are unmapped by any current entity and unused by any
-- @Query / native SQL. They are pure carryover from the B2B e-commerce era.
--
-- Dropping is safe because:
--   1. No active code path reads or writes them
--   2. ddl-auto: update never adds them back (entities don't declare them)
--   3. Existing legacy values would only matter if LEGACY_ECOMMERCE=true is
--      ever flipped on, but the legacy controllers also don't reference these
--      columns (verified via grep on Java + SQL files)
--
-- Idempotent via IF EXISTS.

ALTER TABLE petshop.products    DROP COLUMN IF EXISTS moq;
ALTER TABLE petshop.products    DROP COLUMN IF EXISTS vat_rate;
ALTER TABLE petshop.orders      DROP COLUMN IF EXISTS vat_amount;
ALTER TABLE petshop.order_items DROP COLUMN IF EXISTS vat_rate;
