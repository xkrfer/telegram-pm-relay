-- Migration: 0005_content_filtering_and_edit_monitoring
-- Created at: 2026-01-13
-- Description: Add message filtering, edit monitoring, and general config

-- 1. 修改 system_config 表，增加 general 字段
ALTER TABLE system_config ADD COLUMN general TEXT DEFAULT '{}';

-- 2. 创建 message_filters 表
CREATE TABLE IF NOT EXISTS message_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  regex TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('block', 'drop')) DEFAULT 'block',
  note TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- 3. 修改 messages 表，增加编辑监控字段
ALTER TABLE messages ADD COLUMN last_edit_notification_at INTEGER;
ALTER TABLE messages ADD COLUMN edit_count INTEGER NOT NULL DEFAULT 0;

-- 4. 创建索引（性能优化）
CREATE INDEX idx_message_filters_priority 
ON message_filters(is_active, priority DESC, id ASC);

CREATE INDEX idx_messages_user_msg 
ON messages(user_telegram_id, message_id);

-- 5. 初始化默认 general 配置
UPDATE system_config 
SET general = '{"allowedTypes":["text","photo","video","document","voice","sticker","animation","location","contact"],"editNotificationEnabled":true}' 
WHERE id = 1;
