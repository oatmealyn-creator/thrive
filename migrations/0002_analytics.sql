-- Thrive — analytics tables for page view tracking
-- Run after the initial schema:
--   npx wrangler d1 execute thrive-db --file=migrations/0002_analytics.sql --remote

CREATE TABLE IF NOT EXISTS page_visits (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  path      TEXT NOT NULL,
  referrer  TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  ip_hash   TEXT NOT NULL DEFAULT '',
  country   TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created ON page_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_path ON page_visits (path);
