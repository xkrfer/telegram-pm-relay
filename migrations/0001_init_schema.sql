-- Migration: 0001_init_schema
-- Created at: 2026-01-13

-- Users表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT,
  is_blocked INTEGER DEFAULT 0 NOT NULL,
  last_notification_at INTEGER,
  note TEXT,
  first_message_at INTEGER,
  message_count INTEGER DEFAULT 0 NOT NULL,
  last_message_times TEXT DEFAULT '[]' NOT NULL,
  rate_limit_level INTEGER DEFAULT 0 NOT NULL,
  rate_limit_violations INTEGER DEFAULT 0 NOT NULL,
  rate_limited_until INTEGER,
  is_verified INTEGER DEFAULT 0 NOT NULL,
  verification_token TEXT,
  verification_expires_at INTEGER,
  verification_attempts INTEGER DEFAULT 0 NOT NULL,
  verification_last_attempt INTEGER,
  verification_cooldown_until INTEGER,
  verified_at INTEGER,
  verification_data TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Message Maps表
CREATE TABLE IF NOT EXISTS message_maps (
  admin_message_id TEXT PRIMARY KEY NOT NULL,
  user_telegram_id TEXT NOT NULL,
  original_message_id TEXT,
  media_group_id TEXT,
  is_revoked INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (user_telegram_id) REFERENCES users(id)
);

-- Messages表
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_telegram_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
  message_type TEXT NOT NULL CHECK(message_type IN ('text', 'photo', 'video', 'document', 'voice', 'sticker', 'animation', 'location', 'contact')),
  content TEXT,
  raw_data TEXT,
  media_group_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (user_telegram_id) REFERENCES users(id)
);

-- Reply Templates表
CREATE TABLE IF NOT EXISTS reply_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Fraud List表
CREATE TABLE IF NOT EXISTS fraud_list (
  telegram_id TEXT PRIMARY KEY NOT NULL,
  reason TEXT,
  expires_at INTEGER,
  added_by TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- System Config表
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  verification TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_by TEXT
);
