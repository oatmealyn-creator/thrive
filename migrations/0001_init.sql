-- Thrive — initial schema for Cloudflare D1 (SQLite)
-- Run once after creating the database:
--   npx wrangler d1 execute thrive-db --file=migrations/0001_init.sql --remote

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id         TEXT PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,            -- "pbkdf2$iter$saltHex$hashHex"
  name            TEXT NOT NULL,
  store_name      TEXT NOT NULL,
  bio             TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  picture         TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- ── items ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  item_id      TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  price        REAL NOT NULL,
  category     TEXT NOT NULL,               -- Plants | Pots | Tools | Seeds | Accessories
  description  TEXT NOT NULL DEFAULT '',
  stock        INTEGER NOT NULL DEFAULT 1,
  image_base64 TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_user_id    ON items (user_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at);

-- ── sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  session_id  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
