-- Migration: 0002_create_fts
-- Created at: 2026-01-13
-- Description: Create FTS5 virtual table for full-text search

-- 创建FTS5虚拟表
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  message_id UNINDEXED,
  user_telegram_id UNINDEXED,
  content,
  direction UNINDEXED,
  created_at UNINDEXED,
  content='messages',
  content_rowid='id'
);

-- 创建触发器：插入时同步到FTS表
CREATE TRIGGER IF NOT EXISTS messages_fts_insert AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, message_id, user_telegram_id, content, direction, created_at)
  VALUES (new.id, new.message_id, new.user_telegram_id, new.content, new.direction, new.created_at);
END;

-- 创建触发器：更新时同步到FTS表
CREATE TRIGGER IF NOT EXISTS messages_fts_update AFTER UPDATE ON messages BEGIN
  UPDATE messages_fts 
  SET message_id = new.message_id,
      user_telegram_id = new.user_telegram_id,
      content = new.content,
      direction = new.direction,
      created_at = new.created_at
  WHERE rowid = new.id;
END;

-- 创建触发器：删除时同步到FTS表
CREATE TRIGGER IF NOT EXISTS messages_fts_delete AFTER DELETE ON messages BEGIN
  DELETE FROM messages_fts WHERE rowid = old.id;
END;
