import { fraudList } from '../db/schema';
import { eq, or, isNull, gt, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { getMessages, type Language } from '../i18n';

export async function banUser(
  db: DrizzleD1Database<typeof schema>,
  telegramId: string,
  reason: string,
  addedBy: string,
  hours?: number
) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = hours
      ? now + hours * 60 * 60
      : null;

    const [banned] = await db
      .insert(fraudList)
      .values({
        telegramId,
        reason,
        addedBy,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: fraudList.telegramId,
        set: {
          reason,
          expiresAt,
          addedBy,
          updatedAt: now,
        },
      })
      .returning();

    return { success: true, banned };
  } catch (error) {
    // Return generic error, caller should use i18n message
    return { success: false, error: 'Ban failed' };
  }
}

export async function unbanUser(
  db: DrizzleD1Database<typeof schema>,
  telegramId: string
) {
  try {
    const [unbanned] = await db
      .delete(fraudList)
      .where(eq(fraudList.telegramId, telegramId))
      .returning();
    return { success: !!unbanned, unbanned };
  } catch (error) {
    return { success: false, error: 'Unban failed' };
  }
}

export async function checkBanned(
  db: DrizzleD1Database<typeof schema>,
  telegramId: string
) {
  const [record] = await db
    .select()
    .from(fraudList)
    .where(eq(fraudList.telegramId, telegramId))
    .limit(1);

  if (!record) {
    return { banned: false };
  }

  // Check if expired
  const now = Math.floor(Date.now() / 1000);
  if (record.expiresAt && record.expiresAt < now) {
    // Auto-unban
    await unbanUser(db, telegramId);
    return { banned: false };
  }

  return {
    banned: true,
    reason: record.reason,
    expiresAt: record.expiresAt,
  };
}

export async function getActiveBanList(
  db: DrizzleD1Database<typeof schema>
) {
  const now = Math.floor(Date.now() / 1000);
  return await db
    .select()
    .from(fraudList)
    .where(
      or(
        isNull(fraudList.expiresAt),
        gt(fraudList.expiresAt, now)
      )
    );
}

export async function exportBanList(
  db: DrizzleD1Database<typeof schema>
) {
  const list = await db.select().from(fraudList);
  
  // Generate CSV
  const header = 'telegram_id,reason,expires_at,created_at\n';
  const rows = list.map(item => {
    const expiresAt = item.expiresAt ? new Date(item.expiresAt * 1000).toISOString() : '';
    const createdAt = new Date(item.createdAt * 1000).toISOString();
    const reason = (item.reason || '').replace(/"/g, '""'); // Escape quotes
    return `${item.telegramId},"${reason}",${expiresAt},${createdAt}`;
  }).join('\n');
  
  return header + rows;
}

export async function importBanList(
  db: DrizzleD1Database<typeof schema>,
  csvContent: string,
  addedBy: string,
  lang: Language = 'en'
) {
  const m = getMessages(lang);
  const lines = csvContent.trim().split('\n');
  const imported: string[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const [telegramId, reason] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      
      await db.insert(fraudList).values({
        telegramId,
        reason: reason || m.fraud.bulkImport,
        addedBy,
        expiresAt: null,
      }).onConflictDoNothing();
      
      imported.push(telegramId);
    } catch (error) {
      errors.push(m.fraud.rowFormatError(i + 1));
    }
  }

  return { imported: imported.length, errors };
}
