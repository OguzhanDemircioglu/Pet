-- V8: Allow STAFF role on users.
--
-- The User.Role enum gained a STAFF tier (between ADMIN and the legacy CUSTOMER)
-- to back the SaaS owner/employee split. Hibernate's ddl-auto: update never
-- modifies CHECK constraints, so the original 'role IN (ADMIN, CUSTOMER)'
-- constraint must be replaced by hand. Idempotent — drops the existing check
-- only if it's the legacy 2-value form, then installs the 3-value form.

ALTER TABLE petshop.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE petshop.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER'));
