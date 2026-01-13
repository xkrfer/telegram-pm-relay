-- Migration: 0003_create_indexes
-- Created at: 2026-01-13
-- Description: Create indexes for performance optimization

-- Message Maps索引
CREATE INDEX IF NOT EXISTS idx_message_maps_user ON message_maps(user_telegram_id);

-- Messages索引
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- Users索引
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- Fraud List索引
CREATE INDEX IF NOT EXISTS idx_fraud_list_expires ON fraud_list(expires_at);
