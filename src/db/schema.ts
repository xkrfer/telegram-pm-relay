import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users表 - 核心用户信息
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Telegram ID存储为TEXT
  username: text('username'),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(false),
  lastNotificationAt: integer('last_notification_at'), // Unix timestamp
  note: text('note'),
  firstMessageAt: integer('first_message_at'), // Unix timestamp
  messageCount: integer('message_count').notNull().default(0),
  lastMessageTimes: text('last_message_times').notNull().default('[]'), // JSON string
  rateLimitLevel: integer('rate_limit_level').notNull().default(0),
  rateLimitViolations: integer('rate_limit_violations').notNull().default(0),
  rateLimitedUntil: integer('rate_limited_until'), // Unix timestamp
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  verificationExpiresAt: integer('verification_expires_at'), // Unix timestamp
  verificationAttempts: integer('verification_attempts').notNull().default(0),
  verificationLastAttempt: integer('verification_last_attempt'), // Unix timestamp
  verificationCooldownUntil: integer('verification_cooldown_until'), // Unix timestamp
  verifiedAt: integer('verified_at'), // Unix timestamp
  verificationData: text('verification_data'), // JSON string
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// Message Maps表 - 消息映射关系
export const messageMaps = sqliteTable('message_maps', {
  adminMessageId: text('admin_message_id').primaryKey(),
  userTelegramId: text('user_telegram_id').notNull().references(() => users.id),
  originalMessageId: text('original_message_id'),
  mediaGroupId: text('media_group_id'),
  isRevoked: integer('is_revoked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
});

// Messages表 - 完整消息历史
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userTelegramId: text('user_telegram_id').notNull().references(() => users.id),
  messageId: text('message_id').notNull(),
  direction: text('direction', { enum: ['in', 'out'] }).notNull(),
  messageType: text('message_type', { 
    enum: ['text', 'photo', 'video', 'document', 'voice', 'sticker', 'animation', 'location', 'contact'] 
  }).notNull(),
  content: text('content'),
  rawData: text('raw_data'), // JSON string
  mediaGroupId: text('media_group_id'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
});

// Reply Templates表 - 快捷回复模板
export const replyTemplates = sqliteTable('reply_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  keyword: text('keyword', { length: 50 }).notNull().unique(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
});

// Fraud List表 - 黑名单
export const fraudList = sqliteTable('fraud_list', {
  telegramId: text('telegram_id').primaryKey(),
  reason: text('reason'),
  expiresAt: integer('expires_at'), // Unix timestamp
  addedBy: text('added_by'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
});

// System Config表 - 系统配置
export const systemConfig = sqliteTable('system_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  verification: text('verification').notNull(), // JSON string
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`), // Unix timestamp
  updatedBy: text('updated_by'),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MessageMap = typeof messageMaps.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ReplyTemplate = typeof replyTemplates.$inferSelect;
export type FraudListItem = typeof fraudList.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
