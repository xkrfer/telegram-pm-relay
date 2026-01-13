import { replyTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export async function addTemplate(
  db: DrizzleD1Database<typeof schema>,
  keyword: string,
  content: string
) {
  try {
    const [template] = await db.insert(replyTemplates).values({
      keyword,
      content,
    }).returning();
    return { success: true, template };
  } catch (error: any) {
    // SQLite 唯一约束错误码
    if (error.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: '该关键词已存在' };
    }
    return { success: false, error: '添加模板失败' };
  }
}

export async function getTemplate(
  db: DrizzleD1Database<typeof schema>,
  keyword: string
) {
  const [template] = await db
    .select()
    .from(replyTemplates)
    .where(eq(replyTemplates.keyword, keyword))
    .limit(1);
  return template;
}

export async function getAllTemplates(
  db: DrizzleD1Database<typeof schema>
) {
  return await db.select().from(replyTemplates);
}

export async function deleteTemplate(
  db: DrizzleD1Database<typeof schema>,
  keyword: string
) {
  try {
    const [deleted] = await db
      .delete(replyTemplates)
      .where(eq(replyTemplates.keyword, keyword))
      .returning();
    return { success: !!deleted, template: deleted };
  } catch (error) {
    return { success: false, error: '删除模板失败' };
  }
}
