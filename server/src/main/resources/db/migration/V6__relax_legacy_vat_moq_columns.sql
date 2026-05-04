-- V6: SaaS pivot — relax legacy e-commerce NOT NULL columns that the new
-- SaaS entities (Product, Order, OrderItem) no longer manage.
--
-- Why: products.moq + products.vat_rate, orders.vat_amount, order_items.vat_rate
-- are leftovers from the B2B e-commerce schema. The SaaS Product/Order builders
-- never populate them, so INSERT fails with "null value in column ... violates
-- not-null constraint". Existing legacy rows keep their values; new SaaS rows
-- get NULL, which is semantically correct ("we don't track VAT/MOQ in this mode").
--
-- Idempotent: each ALTER is guarded by an information_schema check so re-runs
-- on databases where the column was already dropped or relaxed are no-ops.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'petshop' AND table_name = 'products'
                 AND column_name = 'moq' AND is_nullable = 'NO') THEN
        ALTER TABLE petshop.products ALTER COLUMN moq DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'petshop' AND table_name = 'products'
                 AND column_name = 'vat_rate' AND is_nullable = 'NO') THEN
        ALTER TABLE petshop.products ALTER COLUMN vat_rate DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'petshop' AND table_name = 'orders'
                 AND column_name = 'vat_amount' AND is_nullable = 'NO') THEN
        ALTER TABLE petshop.orders ALTER COLUMN vat_amount DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'petshop' AND table_name = 'order_items'
                 AND column_name = 'vat_rate' AND is_nullable = 'NO') THEN
        ALTER TABLE petshop.order_items ALTER COLUMN vat_rate DROP NOT NULL;
    END IF;
END $$;
