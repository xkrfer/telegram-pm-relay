import { users, messageMaps } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { sendMessage, forwardMessage, escapeMarkdownV2 } from "../lib/telegram";
import type { ParsedEnv } from "../env";
import { getLang, getMessages, formatDuration } from "../i18n";
import { saveMessage } from "../services/message.service";
import { checkBanned } from "../services/fraud.service";
import {
  checkRateLimit,
  recordMessageTime,
  handleRateLimitViolation,
} from "../services/ratelimit.service";
import {
  getVerificationStatus,
  canRequestVerification,
  recordVerificationAttempt,
  startVerification,
} from "../services/verification.service";
import { configService } from "../services/config.service";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Api } from "grammy";

export async function handleGuestMessage(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  env: ParsedEnv,
  msg: any,
  chatId: string
) {
  const lang = getLang(env);
  const m = getMessages(lang);

  // Handle /start
  if (msg.text === "/start") {
    await sendMessage(api, chatId, m.user.start, env);
    
    // Set empty menu for regular users (hide command menu)
    try {
      await api.setMyCommands([], { scope: { type: "chat", chat_id: chatId } });
    } catch (error) {
      console.error("[GuestHandler]", "Failed to set menu", error);
    }
    
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  // 1. Upsert user
  const [upsertedUser] = await db
    .insert(users)
    .values({
      id: chatId,
      username: msg.chat.username || null,
      lastNotificationAt: null,
      firstMessageAt: now,
      messageCount: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: msg.chat.username || null,
        messageCount: sql`${users.messageCount} + 1`,
        updatedAt: now,
      },
    })
    .returning();

  // 3. Query user status
  const user = await db.query.users.findFirst({
    where: eq(users.id, chatId),
  });

  if (user?.isBlocked) {
    console.log('[GuestHandler]', 'Blocked user attempted to send message', { chatId });
    return; // Silently ignore
  }

  // 4. Verification check
  const config = await configService.getVerificationConfig(db, env);
  if (config.enabled && config.method !== "none" && !user?.isVerified) {
    const verifyStatus = await getVerificationStatus(db, chatId);

    // If has active verification link
    if (verifyStatus.hasActiveLink) {
      // For Turnstile (Web verification), prompt user to use previous link
      if (config.method === "turnstile") {
        await sendMessage(api, chatId, m.user.verificationPending, env);
        return;
      }

      // For inline verification (Math/Quiz/AI), allow restart
      // Clear old verification data
      await db
        .update(users)
        .set({
          verificationToken: null,
          verificationExpiresAt: null,
          verificationData: null,
          updatedAt: now,
        })
        .where(eq(users.id, chatId));

      console.log('[GuestHandler]', 'Cleared previous verification data', {
        userId: chatId,
        method: config.method,
      });
    }

    // Check if can request new verification link
    const canVerify = await canRequestVerification(db, chatId);

    if (!canVerify.allowed) {
      // In cooldown or reached limit
      let message = m.user.verificationRequired;

      if (canVerify.cooldownEnds) {
        const secondsLeft = canVerify.cooldownEnds - now;
        message += m.user.verificationCooldown(formatDuration(lang, secondsLeft));
      } else if (canVerify.attemptsRemaining === 0) {
        message += m.user.verificationLimitReached;
      } else {
        message += canVerify.reason || "";
      }

      await sendMessage(api, chatId, message, env);
      return;
    }

    // Start verification flow
    try {
      await recordVerificationAttempt(db, chatId);

      const result = await startVerification(db, api, env, chatId, lang);

      if (!result.success) {
        await sendMessage(api, chatId, m.user.verificationStartFailed, env);
        return;
      }

      console.log('[GuestHandler]', 'Verification started for user', {
        userId: chatId,
        method: config.method,
      });
      return;
    } catch (error) {
      console.error('[GuestHandler]', 'Failed to start verification', error);
      await sendMessage(api, chatId, m.user.verificationStartFailed, env);
      return;
    }
  }

  // 5. Rate limit check
  const rateLimitCheck = await checkRateLimit(db, chatId, user, env, lang);

  if (!rateLimitCheck.allowed) {
    // Handle rate limit violation
    const warning = await handleRateLimitViolation(
      db,
      chatId,
      user,
      rateLimitCheck.waitTime || 60,
      env,
      lang
    );
    await sendMessage(api, chatId, warning.message, env);

    // Notify admin (first violation only)
    if (warning.isFirstViolation) {
      const name = msg.chat.first_name || msg.chat.username || m.misc.unknown;
      await sendMessage(
        api,
        env.ADMIN_UID.toString(),
        m.user.rateLimitedNotify(name, chatId, rateLimitCheck.reason || ""),
        env
      );
    }

    console.log('[GuestHandler]', 'User rate limited', { chatId, reason: rateLimitCheck.reason });
    return; // Don't forward message
  }

  // Record message time
  await recordMessageTime(db, chatId);

  // 6. Check if first message (send auto welcome)
  if (env.AUTO_WELCOME && user?.messageCount === 1) {
    try {
      await sendMessage(api, chatId, env.WELCOME_MESSAGE, env);
    } catch (error) {
      console.warn('[GuestHandler]', 'Failed to send welcome message', error);
    }
  }

  // 7. Fraud detection
  const banCheck = await checkBanned(db, chatId);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  if (banCheck.banned) {
    const expiresText = banCheck.expiresAt
      ? new Date(banCheck.expiresAt * 1000).toLocaleString(locale)
      : undefined;
    await sendMessage(
      api,
      env.ADMIN_UID.toString(),
      m.user.highRiskWarning(chatId, banCheck.reason || m.misc.notSpecified, expiresText),
      env
    );
  }

  // 8. Notification rate limit
  const lastNotif = user?.lastNotificationAt;

  if (!lastNotif || now - lastNotif > env.NOTIFY_INTERVAL / 1000) {
    const name = msg.chat.first_name || msg.chat.username || m.misc.unknown;
    const escapedName = escapeMarkdownV2(name);
    const escapedChatId = escapeMarkdownV2(chatId.toString());
    await sendMessage(
      api,
      env.ADMIN_UID.toString(),
      m.user.newSession(escapedName, escapedChatId),
      env,
      {
        parse_mode: "MarkdownV2",
      }
    );

    await db
      .update(users)
      .set({ lastNotificationAt: now, updatedAt: now })
      .where(eq(users.id, chatId));
  }

  // 9. Forward message and save records
  try {
    // Forward message
    const fwdMsg = await forwardMessage(
      api,
      env.ADMIN_UID.toString(),
      chatId,
      msg.message_id
    );

    // Save message record
    await saveMessage(db, chatId, msg.message_id.toString(), "in", msg);

    // Write mapping (including media_group_id)
    await db.insert(messageMaps).values({
      adminMessageId: fwdMsg.message_id.toString(),
      userTelegramId: chatId,
      originalMessageId: msg.message_id.toString(),
      mediaGroupId: msg.media_group_id || null,
    });
  } catch (error) {
    console.error('[GuestHandler]', 'Failed to forward message or save records', error);
  }
}
