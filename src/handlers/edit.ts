import { messages } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { sendMessage } from "../lib/telegram";
import type { ParsedEnv } from "../env";
import { getLang, getMessages } from "../i18n";
import { configService } from "../services/config.service";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Api } from "grammy";

/**
 * HTML 转义函数
 * @param text 文本
 * @returns 转义后的文本
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 格式化编辑对比消息
 * @param oldContent 原始内容
 * @param newContent 新内容
 * @param userName 用户名
 * @param userId 用户ID
 * @param editCount 编辑次数
 * @param lang 语言
 * @returns 格式化的 HTML 消息
 */
function formatEditNotification(
  oldContent: string,
  newContent: string,
  userName: string,
  userId: string,
  editCount: number,
  lang: 'en' | 'zh'
): string {
  const m = getMessages(lang);
  
  const escapedUserName = escapeHtml(userName);
  const escapedOld = escapeHtml(oldContent);
  const escapedNew = escapeHtml(newContent);

  let notification = m.admin.editNotificationTitle(escapedUserName, userId);
  notification += m.admin.editNotificationOld(escapedOld);
  notification += m.admin.editNotificationNew(escapedNew);
  
  if (editCount > 1) {
    notification += m.admin.editNotificationCount(editCount);
  }

  return notification;
}

/**
 * 处理消息编辑事件
 * @param db 数据库实例
 * @param api Telegram API
 * @param env 环境变量
 * @param editedMsg 编辑后的消息对象
 */
export async function handleEditedMessage(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  env: ParsedEnv,
  editedMsg: any
): Promise<void> {
  const chatId = editedMsg.chat.id.toString();
  const lang = getLang(env);
  const m = getMessages(lang);

  try {
    // 1. 检查全局配置
    const generalConfig = await configService.getGeneralConfig(db, env);
    if (!generalConfig.editNotificationEnabled) {
      console.log('[EditHandler]', 'Edit notification disabled', { chatId });
      return;
    }

    // 2. 获取原始消息
    const originalMsg = await db.query.messages.findFirst({
      where: and(
        eq(messages.userTelegramId, chatId),
        eq(messages.messageId, editedMsg.message_id.toString())
      )
    });

    if (!originalMsg) {
      console.log('[EditHandler]', 'Original message not found', {
        chatId,
        messageId: editedMsg.message_id
      });
      return;
    }

    // 3. 检查防抖（10秒）
    const now = Math.floor(Date.now() / 1000);
    if (originalMsg.lastEditNotificationAt && 
        now - originalMsg.lastEditNotificationAt < 10) {
      console.log('[EditHandler]', 'Debounced, skipping notification', {
        chatId,
        messageId: editedMsg.message_id,
        timeSinceLastNotify: now - originalMsg.lastEditNotificationAt
      });
      
      // 仍然更新编辑计数
      await db.update(messages)
        .set({
          editCount: sql`${messages.editCount} + 1`
        })
        .where(eq(messages.id, originalMsg.id));
      
      return;
    }

    // 4. 提取内容
    const oldContent = originalMsg.content || '';
    const newContent = editedMsg.text || editedMsg.caption || '';

    // 5. 检查内容是否真的变化
    if (oldContent === newContent) {
      console.log('[EditHandler]', 'Content unchanged', { chatId });
      return;
    }

    // 6. 发送通知给管理员
    const userName = editedMsg.chat.first_name || editedMsg.chat.username || m.misc.unknown;
    const newEditCount = (originalMsg.editCount || 0) + 1;

    const notification = formatEditNotification(
      oldContent,
      newContent,
      userName,
      chatId,
      newEditCount,
      lang
    );

    await sendMessage(
      api,
      env.ADMIN_UID.toString(),
      notification,
      env,
      { parse_mode: 'HTML' }
    );

    // 7. 更新数据库
    await db.update(messages)
      .set({
        content: newContent,
        lastEditNotificationAt: now,
        editCount: newEditCount
      })
      .where(eq(messages.id, originalMsg.id));

    console.log('[EditHandler]', 'Edit notification sent', {
      chatId,
      messageId: editedMsg.message_id,
      editCount: newEditCount
    });

  } catch (error) {
    console.error('[EditHandler]', 'Failed to handle edited message', error);
  }
}
