import { users, messageMaps } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendMessage, copyMessage } from "../lib/telegram";
import type { ParsedEnv } from "../env";
import { getLang, getMessages, formatDuration } from "../i18n";
import { saveMessage, getMessageHistory } from "../services/message.service";
import {
  addTemplate,
  getTemplate,
  getAllTemplates,
  deleteTemplate,
} from "../services/template.service";
import { getStats, formatStats } from "../services/stats.service";
import {
  banUser,
  unbanUser,
  checkBanned,
  getActiveBanList,
  exportBanList,
  importBanList,
} from "../services/fraud.service";
import { searchMessages, formatSearchResults } from "../lib/search";
import {
  setRateLimitLevel,
  resetRateLimit,
  getRateLimitConfig,
} from "../services/ratelimit.service";
import { configService } from "../services/config.service";
import {
  getVerificationStatus,
  createVerificationLink,
  canRequestVerification,
  recordVerificationAttempt,
} from "../services/verification.service";
import type { VerificationMethod } from "../types/verification";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Api } from "grammy";
import { InputFile } from "grammy";

export async function handleAdminMessage(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  env: ParsedEnv,
  msg: any,
  chatId: string
) {
  const text = msg.text?.trim() || "";
  const lang = getLang(env);
  const m = getMessages(lang);

  // Handle /start
  if (text === "/start") {
    const welcomeMsg = m.admin.start.replace(
      "{ADMIN_UID}",
      env.ADMIN_UID.toString()
    );
    await sendMessage(api, chatId, welcomeMsg, env);
    
    // Set admin command menu
    try {
      await api.setMyCommands(
        [
          { command: "start", description: m.admin.menuStart },
          { command: "stats", description: m.admin.menuStats },
          { command: "banlist", description: m.admin.menuBanlist },
          { command: "verification", description: m.admin.menuVerification },
        ],
        { scope: { type: "chat", chat_id: chatId } }
      );
    } catch (error) {
      console.error("[AdminHandler]", "Failed to set menu", error);
    }
    
    return;
  }

  // Commands that don't require reply message

  // /stats - Statistics
  if (text === "/stats") {
    try {
      const stats = await getStats(db);
      const statsText = formatStats(stats, lang);
      await sendMessage(api, chatId, statsText, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to get stats", error);
      await sendMessage(api, chatId, m.admin.statsFailed, env);
    }
    return;
  }

  // /search <keyword> - Search messages
  if (text.startsWith("/search ")) {
    const keyword = text.substring(8).trim();
    if (!keyword) {
      await sendMessage(api, chatId, m.admin.searchNoKeyword, env);
      return;
    }

    try {
      const results = await searchMessages(db, keyword);
      const resultsText = formatSearchResults(results, lang);
      await sendMessage(api, chatId, resultsText, env);
    } catch (error) {
      console.error("[AdminHandler]", "Search failed", error);
      await sendMessage(api, chatId, m.admin.searchFailed, env);
    }
    return;
  }

  // /template add <keyword> <content>
  if (text.startsWith("/template add ")) {
    const args = text.substring(14).trim();
    const firstSpace = args.indexOf(" ");

    if (firstSpace === -1) {
      await sendMessage(api, chatId, m.admin.templateFormatError, env);
      return;
    }

    const keyword = args.substring(0, firstSpace);
    const content = args.substring(firstSpace + 1);

    const result = await addTemplate(db, keyword, content);
    if (result.success) {
      await sendMessage(api, chatId, m.admin.templateAdded(keyword), env);
    } else {
      await sendMessage(api, chatId, `❌ ${result.error}`, env);
    }
    return;
  }

  // /template list
  if (text === "/template list") {
    try {
      const templates = await getAllTemplates(db);
      if (templates.length === 0) {
        await sendMessage(api, chatId, m.admin.templateListEmpty, env);
        return;
      }

      let msg = m.admin.templateListTitle;
      templates.forEach((t, i) => {
        const preview =
          t.content.substring(0, 30) + (t.content.length > 30 ? "..." : "");
        msg += `${i + 1}. /${t.keyword}\n   ${preview}\n\n`;
      });

      await sendMessage(api, chatId, msg, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to list templates", error);
      await sendMessage(api, chatId, m.admin.templateListFailed, env);
    }
    return;
  }

  // /template delete <keyword>
  if (text.startsWith("/template delete ")) {
    const keyword = text.substring(17).trim();
    const result = await deleteTemplate(db, keyword);

    if (result.success) {
      await sendMessage(api, chatId, m.admin.templateDeleted(keyword), env);
    } else {
      await sendMessage(api, chatId, `❌ ${result.error}`, env);
    }
    return;
  }

  // /banlist - View banlist
  if (text === "/banlist") {
    try {
      const banList = await getActiveBanList(db);
      if (banList.length === 0) {
        await sendMessage(api, chatId, m.admin.banlistEmpty, env);
        return;
      }

      let msg = m.admin.banlistTitle(banList.length);
      banList.slice(0, 20).forEach((item, i) => {
        const expires = item.expiresAt
          ? `\n   ${m.misc.expiresAt}: ${new Date(item.expiresAt * 1000).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}`
          : "";
        msg += `${i + 1}. ${item.telegramId}\n   ${m.misc.reason}: ${
          item.reason || m.misc.notSpecified
        }${expires}\n\n`;
      });

      if (banList.length > 20) {
        msg += `\n${m.misc.moreItems(banList.length - 20)}`;
      }

      await sendMessage(api, chatId, msg, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to get ban list", error);
      await sendMessage(api, chatId, m.admin.banlistFailed, env);
    }
    return;
  }

  // /export - Export banlist
  if (text === "/export") {
    try {
      const csv = await exportBanList(db);
      const blob = new Blob([csv], { type: "text/csv" });
      await api.sendDocument(chatId, new InputFile(blob, "banlist.csv"));
    } catch (error) {
      console.error("[AdminHandler]", "Failed to export ban list", error);
      await sendMessage(api, chatId, m.admin.exportFailed, env);
    }
    return;
  }

  // /import - Import banlist (requires replying to CSV file)
  if (text === "/import") {
    if (!msg.reply_to_message?.document) {
      await sendMessage(api, chatId, m.admin.importNeedFile, env);
      return;
    }

    try {
      const fileId = msg.reply_to_message.document.file_id;
      const file = await api.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;

      const response = await fetch(fileUrl);
      const csvContent = await response.text();

      const result = await importBanList(db, csvContent, chatId, lang);

      let resultMsg = m.admin.importSuccess(result.imported, result.errors.length);
      if (result.errors.length > 0) {
        resultMsg += m.admin.importErrors(result.errors);
      }

      await sendMessage(api, chatId, resultMsg, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to import ban list", error);
      await sendMessage(api, chatId, m.admin.importFailed, env);
    }
    return;
  }

  // /ratelimit - Rate limit management
  if (text.startsWith("/ratelimit ")) {
    const args = text.substring(11).trim().split(" ");

    // /ratelimit reset <user_id>
    if (args[0] === "reset" && args[1]) {
      try {
        const targetId = args[1];
        await resetRateLimit(db, targetId);
        await sendMessage(api, chatId, m.admin.rateLimitReset(targetId), env);
      } catch (error) {
        console.error("[AdminHandler]", "Failed to reset rate limit", error);
        await sendMessage(api, chatId, m.admin.rateLimitResetFailed, env);
      }
      return;
    }

    // /ratelimit <user_id> <level>
    if (args.length >= 2) {
      try {
        const targetId = args[0];
        const level = parseInt(args[1]);

        if (level < 0 || level > 3) {
          await sendMessage(api, chatId, m.admin.rateLimitLevelError, env);
          return;
        }

        await setRateLimitLevel(db, targetId, level);

        const config = getRateLimitConfig(level, env);
        await sendMessage(
          api,
          chatId,
          m.admin.rateLimitSet(
            targetId,
            m.rateLimitLevels[level],
            config.cooldown,
            config.perMinute,
            config.perHour
          ),
          env
        );
      } catch (error) {
        console.error("[AdminHandler]", "Failed to set rate limit", error);
        await sendMessage(api, chatId, m.admin.rateLimitSetFailed, env);
      }
      return;
    }

    // Show usage
    await sendMessage(api, chatId, m.admin.rateLimitUsage, env);
    return;
  }

  // /verification status - View verification system status
  if (text === "/verification status") {
    try {
      const config = await configService.getVerificationConfig(db, env);
      const validation = await configService.validateMethodConfig(
        config.method,
        env
      );

      let statusMsg = m.admin.verificationStatusTitle;
      statusMsg += config.enabled ? m.admin.verificationStatusEnabled : m.admin.verificationStatusDisabled;
      statusMsg += m.admin.verificationStatusMethod(m.methodNames[config.method]);
      statusMsg += m.admin.verificationStatusTimeout(Math.floor(config.timeout / 60));

      if (config.method !== "none") {
        statusMsg += validation.valid ? m.admin.verificationStatusComplete : m.admin.verificationStatusIncomplete;
        if (!validation.valid && validation.missing) {
          statusMsg += m.admin.verificationStatusMissing;
          validation.missing.forEach((key: string) => {
            statusMsg += `• ${key}\n`;
          });
        }
      }

      statusMsg += m.admin.verificationStatusHint;

      await sendMessage(api, chatId, statusMsg, env);
    } catch (error) {
      console.error(
        "[AdminHandler]",
        "Failed to get verification status",
        error
      );
      await sendMessage(api, chatId, m.admin.verificationStatusFailed, env);
    }
    return;
  }

  // /verification set <method> - Set verification method
  if (text.startsWith("/verification set ")) {
    const method = text.substring(18).trim() as VerificationMethod;

    if (!["none", "math", "quiz", "turnstile", "ai"].includes(method)) {
      await sendMessage(api, chatId, m.admin.verificationMethodInvalid, env);
      return;
    }

    try {
      const result = await configService.setVerificationMethod(
        db,
        env,
        method,
        chatId,
        lang
      );

      if (result.success) {
        await sendMessage(
          api,
          chatId,
          m.admin.verificationMethodSet(m.methodNames[method]),
          env
        );
      } else {
        await sendMessage(
          api,
          chatId,
          m.admin.verificationMethodSetFailed(result.error || ""),
          env
        );
      }
    } catch (error) {
      console.error(
        "[AdminHandler]",
        "Failed to set verification method",
        error
      );
      await sendMessage(api, chatId, m.admin.verificationMethodSetFailed(""), env);
    }
    return;
  }

  // /verification enable - Enable verification
  if (text === "/verification enable") {
    try {
      const result = await configService.setVerificationEnabled(
        db,
        env,
        true,
        chatId,
        lang
      );
      if (result.success) {
        await sendMessage(api, chatId, m.admin.verificationEnabled, env);
      } else {
        await sendMessage(api, chatId, m.admin.verificationEnableFailed(result.error || ""), env);
      }
    } catch (error) {
      console.error("[AdminHandler]", "Failed to enable verification", error);
      await sendMessage(api, chatId, m.admin.verificationEnableFailed(""), env);
    }
    return;
  }

  // /verification disable - Disable verification
  if (text === "/verification disable") {
    try {
      const result = await configService.setVerificationEnabled(
        db,
        env,
        false,
        chatId,
        lang
      );
      if (result.success) {
        await sendMessage(api, chatId, m.admin.verificationDisabled, env);
      } else {
        await sendMessage(api, chatId, m.admin.verificationDisableFailed(result.error || ""), env);
      }
    } catch (error) {
      console.error("[AdminHandler]", "Failed to disable verification", error);
      await sendMessage(api, chatId, m.admin.verificationDisableFailed(""), env);
    }
    return;
  }

  // /verify - Admin sends verification link to user
  if (text.startsWith("/verify ")) {
    const targetIdStr = text.substring(8).trim();

    try {
      const targetId = targetIdStr;

      // Check if user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetId),
      });

      if (!targetUser) {
        await sendMessage(api, chatId, m.admin.verifyUserNotFound(targetId), env);
        return;
      }

      // Check if already verified
      if (targetUser.isVerified) {
        await sendMessage(api, chatId, m.admin.verifyUserAlreadyVerified(targetId), env);
        return;
      }

      // Check if can request verification
      const canVerify = await canRequestVerification(db, targetId);

      if (!canVerify.allowed) {
        let message = m.admin.verifyCannotGenerate(targetId);

        if (canVerify.cooldownEnds) {
          const now = Math.floor(Date.now() / 1000);
          const secondsLeft = canVerify.cooldownEnds - now;
          message += m.admin.verifyCooldown(formatDuration(lang, secondsLeft));
        } else {
          message += canVerify.reason || "";
        }

        await sendMessage(api, chatId, message, env);
        return;
      }

      // Generate verification link
      const verifyLink = await createVerificationLink(db, env, targetId);
      await recordVerificationAttempt(db, targetId);

      // Send to admin
      await sendMessage(
        api,
        chatId,
        m.admin.verifyLinkGenerated(
          targetId,
          verifyLink,
          Math.floor(env.VERIFICATION_TIMEOUT / 60),
          canVerify.attemptsRemaining
        ),
        env
      );

      // Send to user
      await sendMessage(
        api,
        targetId,
        m.admin.verifyLinkSentToUser(targetId, Math.floor(env.VERIFICATION_TIMEOUT / 60)) + `\n${verifyLink}`,
        env
      );

      console.log("[AdminHandler]", "Admin sent verification link", {
        userId: targetId,
        adminId: chatId,
      });
    } catch (error) {
      console.error("[AdminHandler]", "Failed to send verification", error);
      await sendMessage(api, chatId, m.admin.verifySendFailed, env);
    }
    return;
  }

  // /reverify - Re-verify (clear verified status)
  if (text.startsWith("/reverify ")) {
    const targetIdStr = text.substring(10).trim();

    try {
      const targetId = targetIdStr;

      // Check if user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetId),
      });

      if (!targetUser) {
        await sendMessage(api, chatId, m.admin.verifyUserNotFound(targetId), env);
        return;
      }

      // Clear verification status
      const now = Math.floor(Date.now() / 1000);
      await db
        .update(users)
        .set({
          isVerified: false,
          verifiedAt: null,
          verificationToken: null,
          verificationExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(users.id, targetId));

      await sendMessage(api, chatId, m.admin.reverifyCleared(targetId), env);

      console.log("[AdminHandler]", "Admin cleared user verification", {
        userId: targetId,
        adminId: chatId,
      });
    } catch (error) {
      console.error("[AdminHandler]", "Failed to clear verification", error);
      await sendMessage(api, chatId, m.admin.reverifyFailed, env);
    }
    return;
  }

  // /reset-verification - Reset verification attempt count and cooldown
  if (text.startsWith("/reset-verification ")) {
    const targetIdStr = text.substring(20).trim();

    try {
      const targetId = targetIdStr;

      // Check if user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetId),
      });

      if (!targetUser) {
        await sendMessage(api, chatId, m.admin.verifyUserNotFound(targetId), env);
        return;
      }

      // Reset verification limits
      const now = Math.floor(Date.now() / 1000);
      await db
        .update(users)
        .set({
          verificationAttempts: 0,
          verificationLastAttempt: null,
          verificationCooldownUntil: null,
          updatedAt: now,
        })
        .where(eq(users.id, targetId));

      await sendMessage(api, chatId, m.admin.resetVerificationDone(targetId), env);

      console.log("[AdminHandler]", "Admin reset verification attempts", {
        userId: targetId,
        adminId: chatId,
      });
    } catch (error) {
      console.error("[AdminHandler]", "Failed to reset verification", error);
      await sendMessage(api, chatId, m.admin.resetVerificationFailed, env);
    }
    return;
  }

  // /ban <user_id> [reason] [hours] - Ban user directly
  if (text.startsWith("/ban ")) {
    const parts = text.split(" ").filter((s: string) => s);
    
    if (parts.length < 2) {
      await sendMessage(api, chatId, m.admin.banUsage, env);
      return;
    }

    const targetUserId = parts[1];
    const reason = parts[2] || (lang === 'zh' ? "违反规则" : "Rule violation");
    const hours = parts[3] ? parseInt(parts[3]) : undefined;

    try {
      const result = await banUser(db, targetUserId, reason, chatId, hours);

      if (result.success) {
        await sendMessage(api, chatId, m.admin.banned(targetUserId, reason, hours), env);

        // Also block
        await db
          .update(users)
          .set({ isBlocked: true, updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(users.id, targetUserId));
      } else {
        await sendMessage(api, chatId, `❌ ${result.error}`, env);
      }
    } catch (error) {
      console.error("[AdminHandler]", "Failed to ban user", error);
      await sendMessage(api, chatId, m.admin.banFailed, env);
    }
    return;
  }

  // /unban <user_id> - Unban user directly
  if (text.startsWith("/unban ")) {
    const parts = text.split(" ").filter((s: string) => s);
    
    if (parts.length < 2) {
      await sendMessage(api, chatId, m.admin.unbanUsage, env);
      return;
    }

    const targetUserId = parts[1];

    try {
      await db
        .update(users)
        .set({ isBlocked: false, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(users.id, targetUserId));

      await unbanUser(db, targetUserId);

      await sendMessage(api, chatId, m.admin.unbanned(targetUserId), env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to unban user", error);
      await sendMessage(api, chatId, m.admin.unbanFailed, env);
    }
    return;
  }

  // Following commands require reply message
  if (!msg.reply_to_message) {
    await sendMessage(api, chatId, m.admin.needReply, env);
    return;
  }

  const replyMsgId = msg.reply_to_message.message_id.toString();

  // Find mapping
  const mapping = await db.query.messageMaps.findFirst({
    where: eq(messageMaps.adminMessageId, replyMsgId),
  });

  if (!mapping) {
    await sendMessage(api, chatId, m.admin.noMapping, env);
    return;
  }

  const targetUserId = mapping.userTelegramId;

  // /block or /ban - Ban user (reply mode)
  if (text.startsWith("/block") || (text.startsWith("/ban") && !text.startsWith("/banlist"))) {
    const parts = text.split(" ").filter((s: string) => s);
    const reason = parts[1] || (lang === 'zh' ? "违反规则" : "Rule violation");
    const hours = parts[2] ? parseInt(parts[2]) : undefined;

    const result = await banUser(db, targetUserId, reason, chatId, hours);

    if (result.success) {
      await sendMessage(api, chatId, m.admin.banned(targetUserId, reason, hours), env);

      // Also block
      await db
        .update(users)
        .set({ isBlocked: true, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(users.id, targetUserId));
    } else {
      await sendMessage(api, chatId, `❌ ${result.error}`, env);
    }
    return;
  }

  // /unblock or /unban - Unban user (reply mode)
  if (text === "/unblock" || text === "/unban") {
    await db
      .update(users)
      .set({ isBlocked: false, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(users.id, targetUserId));

    await unbanUser(db, targetUserId);

    await sendMessage(api, chatId, m.admin.unbanned(targetUserId), env);
    return;
  }

  // /check - Check user status
  if (text === "/check") {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!user) {
      await sendMessage(api, chatId, m.admin.userNotFound, env);
      return;
    }

    const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
    const banCheck = await checkBanned(db, targetUserId);
    const status = user.isBlocked ? m.admin.userInfoStatusBlocked : m.admin.userInfoStatusNormal;
    const username = user.username ? `@${user.username}` : m.misc.none;
    const createdAt = new Date(user.createdAt * 1000).toLocaleString(locale);
    const updatedAt = new Date(user.updatedAt * 1000).toLocaleString(locale);
    const firstMsg = user.firstMessageAt
      ? new Date(user.firstMessageAt * 1000).toLocaleString(locale)
      : m.misc.unknown;

    let info = `${m.admin.userInfoTitle}
${m.admin.userInfoId}: ${targetUserId}
${m.admin.userInfoUsername}: ${username}
${m.admin.userInfoStatus}: ${status}
${m.admin.userInfoMessageCount}: ${user.messageCount}
${m.admin.userInfoFirstMessage}: ${firstMsg}
${m.admin.userInfoCreatedAt}: ${createdAt}
${m.admin.userInfoUpdatedAt}: ${updatedAt}`;

    if (user.note) {
      info += `\n${m.admin.userInfoNote}: ${user.note}`;
    }

    // Rate limit info
    const config = getRateLimitConfig(user.rateLimitLevel || 0, env);
    info += m.admin.userInfoRateLimitTitle;
    info += `${m.admin.userInfoRateLimitLevel}: ${m.rateLimitLevels[user.rateLimitLevel || 0]}`;
    info += m.admin.userInfoRateLimitConfig(config.cooldown, config.perMinute, config.perHour);
    info += `${m.admin.userInfoRateLimitViolations}: ${user.rateLimitViolations || 0}`;

    if (user.rateLimitedUntil) {
      const now = Math.floor(Date.now() / 1000);
      if (user.rateLimitedUntil > now) {
        info += `${m.admin.userInfoRateLimitPenaltyUntil}: ${new Date(user.rateLimitedUntil * 1000).toLocaleString(locale)}`;
      }
    }

    if (banCheck.banned) {
      info += m.admin.userInfoBanTitle;
      info += `${m.admin.userInfoBanReason}: ${banCheck.reason || m.misc.notSpecified}`;
      if (banCheck.expiresAt) {
        info += `${m.admin.userInfoBanExpires}: ${new Date(banCheck.expiresAt * 1000).toLocaleString(locale)}`;
      }
    }

    // Verification info
    if (env.VERIFICATION_REQUIRED) {
      const verifyStatus = await getVerificationStatus(db, targetUserId);
      info += m.admin.userInfoVerificationTitle;

      if (verifyStatus.isVerified) {
        info += m.admin.userInfoVerified;
        if (user.verifiedAt) {
          info += `${m.admin.userInfoVerifiedAt}: ${new Date(user.verifiedAt * 1000).toLocaleString(locale)}`;
        }
      } else {
        info += m.admin.userInfoNotVerified;

        if (verifyStatus.hasActiveLink) {
          info += m.admin.userInfoActiveLink;
        }

        if (verifyStatus.cooldownEnds) {
          const now = Math.floor(Date.now() / 1000);
          const secondsLeft = verifyStatus.cooldownEnds - now;
          info += m.admin.userInfoCooldownUntil(
            new Date(verifyStatus.cooldownEnds * 1000).toLocaleString(locale),
            formatDuration(lang, secondsLeft)
          );
        }

        info += m.admin.userInfoAttempts(user.verificationAttempts || 0, verifyStatus.attemptsRemaining);
      }
    }

    await sendMessage(api, chatId, info, env);
    return;
  }

  // /history - View conversation history
  if (text === "/history") {
    try {
      const history = await getMessageHistory(db, targetUserId, 20);

      if (history.length === 0) {
        await sendMessage(api, chatId, m.admin.historyEmpty, env);
        return;
      }

      const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
      let msg = m.admin.historyTitle(20);
      history.reverse().forEach((h, i) => {
        const time = new Date(h.createdAt * 1000).toLocaleString(locale, {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const dir = h.direction === "in" ? m.admin.historyIn : m.admin.historyOut;
        const preview = h.content
          ? h.content.substring(0, 40) + (h.content.length > 40 ? "..." : "")
          : `[${h.messageType}]`;
        msg += `${i + 1}. ${dir} [${time}] ${preview}\n`;
      });

      await sendMessage(api, chatId, msg, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to get history", error);
      await sendMessage(api, chatId, m.admin.historyFailed, env);
    }
    return;
  }

  // /reply <keyword> - Reply with template
  if (text.startsWith("/reply ")) {
    const keyword = text.substring(7).trim();
    const template = await getTemplate(db, keyword);

    if (!template) {
      await sendMessage(api, chatId, m.admin.templateNotFound(keyword), env);
      return;
    }

    try {
      const sentMsg = await api.sendMessage(targetUserId, template.content);
      const confirmMsg = await sendMessage(
        api,
        chatId,
        m.admin.templateAdded(keyword).replace('added', 'sent'),
        env
      );

      // Record message
      await saveMessage(
        db,
        targetUserId,
        sentMsg.message_id.toString(),
        "out",
        {
          text: template.content,
          message_id: sentMsg.message_id,
        } as any
      );

      // Save mapping for recall
      await db.insert(messageMaps).values({
        adminMessageId: confirmMsg.message_id.toString(),
        userTelegramId: targetUserId,
        originalMessageId: sentMsg.message_id.toString(),
        mediaGroupId: null,
      });
    } catch (error) {
      console.warn("[AdminHandler]", "Failed to send template", error);
      await sendMessage(api, chatId, m.admin.sendFailed, env);
    }
    return;
  }

  // /recall - Recall message
  if (text === "/recall") {
    if (mapping.isRevoked) {
      await sendMessage(api, chatId, m.admin.recallAlreadyRevoked, env);
      return;
    }

    try {
      if (!mapping.originalMessageId) {
        await sendMessage(api, chatId, m.admin.recallNoMessage, env);
        return;
      }

      await api.deleteMessage(targetUserId, Number(mapping.originalMessageId));

      const now = Math.floor(Date.now() / 1000);
      await db
        .update(messageMaps)
        .set({ isRevoked: true, updatedAt: now })
        .where(eq(messageMaps.adminMessageId, replyMsgId));

      await sendMessage(api, chatId, m.admin.recallSuccess, env);
    } catch (error) {
      console.error("[AdminHandler]", "Failed to recall message", error);
      await sendMessage(api, chatId, m.admin.recallFailed, env);
    }
    return;
  }

  // /mark - Mark message
  if (text === "/mark") {
    await sendMessage(api, chatId, m.admin.markSuccess, env);
    return;
  }

  // /unmark - Unmark message
  if (text === "/unmark") {
    await sendMessage(api, chatId, m.admin.unmarkSuccess, env);
    return;
  }

  // Check for unknown command or template shortcut
  if (text.startsWith("/")) {
    const keyword = text.substring(1).split(" ")[0];
    const template = await getTemplate(db, keyword);

    if (template) {
      // Found template, auto-execute template reply
      try {
        const sentMsg = await api.sendMessage(targetUserId, template.content);
        const confirmMsg = await sendMessage(
          api,
          chatId,
          `✅ ${lang === 'zh' ? '已发送模板' : 'Sent template'} "${keyword}"`,
          env
        );

        // Record message
        await saveMessage(
          db,
          targetUserId,
          sentMsg.message_id.toString(),
          "out",
          {
            text: template.content,
            message_id: sentMsg.message_id,
          } as any
        );

        // Save mapping
        await db.insert(messageMaps).values({
          adminMessageId: confirmMsg.message_id.toString(),
          userTelegramId: targetUserId,
          originalMessageId: sentMsg.message_id.toString(),
          mediaGroupId: null,
        });

        return;
      } catch (error) {
        console.warn("[AdminHandler]", "Failed to send template", error);
        await sendMessage(api, chatId, m.admin.sendFailed, env);
        return;
      }
    }

    // Not a template, show unknown command
    await sendMessage(api, chatId, m.admin.unknownCommand(keyword), env);
    return;
  }

  // Regular reply
  try {
    const copiedMsg = await copyMessage(
      api,
      targetUserId,
      chatId,
      msg.message_id
    );

    // Record admin's message
    await saveMessage(db, targetUserId, msg.message_id.toString(), "out", msg);

    // Save reverse mapping for recall
    await db.insert(messageMaps).values({
      adminMessageId: msg.message_id.toString(),
      userTelegramId: targetUserId,
      originalMessageId: copiedMsg.message_id.toString(),
      mediaGroupId: msg.media_group_id || null,
    });
  } catch (error) {
    console.warn("[AdminHandler]", "Copy message to user failed", error);
    await sendMessage(api, chatId, m.admin.sendFailed, env);
  }
}
