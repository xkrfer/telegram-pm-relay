import { messages, users, fraudList } from '../db/schema';
import { eq, gte, and, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { getMessages, type Language } from '../i18n';

export async function getStats(
  db: DrizzleD1Database<typeof schema>
) {
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 24 * 60 * 60;

  // Today's incoming messages
  const [todayIn] = await db
    .select({ count: sql<string>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.direction, 'in'),
        gte(messages.createdAt, dayAgo)
      )
    );

  // Today's outgoing messages
  const [todayOut] = await db
    .select({ count: sql<string>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.direction, 'out'),
        gte(messages.createdAt, dayAgo)
      )
    );

  // Active users today (unique users who sent messages)
  const [activeUsers] = await db
    .select({ count: sql<string>`count(DISTINCT user_telegram_id)` })
    .from(messages)
    .where(
      and(
        eq(messages.direction, 'in'),
        gte(messages.createdAt, dayAgo)
      )
    );

  // Total users
  const [totalUsers] = await db
    .select({ count: sql<string>`count(*)` })
    .from(users);

  // Total messages
  const [totalMessages] = await db
    .select({ count: sql<string>`count(*)` })
    .from(messages);

  // Fraud list count
  const [fraudCount] = await db
    .select({ count: sql<string>`count(*)` })
    .from(fraudList);

  return {
    today: {
      in: parseInt(todayIn.count),
      out: parseInt(todayOut.count),
      activeUsers: parseInt(activeUsers.count),
    },
    total: {
      users: parseInt(totalUsers.count),
      messages: parseInt(totalMessages.count),
      fraudList: parseInt(fraudCount.count),
    },
  };
}

export function formatStats(stats: Awaited<ReturnType<typeof getStats>>, lang: Language = 'en') {
  const m = getMessages(lang);
  
  return `${m.stats.title}
${m.stats.separator}
${m.stats.received(stats.today.in)}
${m.stats.sent(stats.today.out)}
${m.stats.activeUsers(stats.today.activeUsers)}
${m.stats.totalTitle}
${m.stats.separator}
${m.stats.totalUsers(stats.total.users)}
${m.stats.totalMessages(stats.total.messages)}
${m.stats.banlist(stats.total.fraudList)}`;
}
