-- V3: Password reset token tablosu

CREATE TABLE IF NOT EXISTS petshop.password_reset_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES petshop.users(id) ON DELETE CASCADE,
  token       VARCHAR(128) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user    ON petshop.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_token   ON petshop.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_expires ON petshop.password_reset_tokens(expires_at);
