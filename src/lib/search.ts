import { sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { getMessages, type Language } from '../i18n';

/**
 * Search messages (using FTS5)
 */
export async function searchMessages(
  db: DrizzleD1Database<typeof schema>,
  keyword: string,
  limit: number = 10
) {
  try {
    // FTS5 query
    const results = await db.run(sql`
      SELECT 
        m.id,
        m.user_telegram_id as userId,
        m.content,
        m.message_type as messageType,
        m.direction,
        m.created_at as createdAt
      FROM messages m
      INNER JOIN messages_fts fts ON m.id = fts.rowid
      WHERE messages_fts MATCH ${keyword}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `);
    
    return results.results as any[];
  } catch (error) {
    console.error('Search failed:', error);
    // Fallback to LIKE search
    return fallbackSearch(db, keyword, limit);
  }
}

/**
 * Fallback search (LIKE query)
 */
async function fallbackSearch(
  db: DrizzleD1Database<typeof schema>,
  keyword: string,
  limit: number
) {
  const results = await db.run(sql`
    SELECT 
      id,
      user_telegram_id as userId,
      content,
      message_type as messageType,
      direction,
      created_at as createdAt
    FROM messages
    WHERE content LIKE ${'%' + keyword + '%'}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  
  return results.results as any[];
}

/**
 * Format search results
 */
export function formatSearchResults(results: any[], lang: Language = 'en') {
  const m = getMessages(lang);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  
  if (results.length === 0) {
    return m.search.noResults;
  }

  let text = m.search.resultsTitle(results.length);
  
  results.forEach((msg, index) => {
    const date = new Date(msg.createdAt * 1000).toLocaleString(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const direction = msg.direction === 'in' ? m.search.received : m.search.sent;
    const preview = msg.content
      ? msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
      : `[${msg.messageType}]`;
    
    text += `${index + 1}. [${date}] ${direction} | ${lang === 'zh' ? '用户' : 'User'} ${msg.userId}\n`;
    text += `   ${preview}\n\n`;
  });

  return text;
}
