/**
 * English Language Pack
 */
import type { Messages } from "./types";

export const en: Messages = {
  // Common messages
  common: {
    yes: "Yes",
    no: "No",
    error: "Error",
    success: "Success",
    failed: "Failed",
    unknown: "Unknown",
    notFound: "Not found",
  },

  // Admin messages
  admin: {
    start: `👋 Telegram PM Relay Admin Panel Ready

Current Admin ID: {ADMIN_UID}

📋 Basic Operations:
• Reply to forwarded messages to respond directly
• /block - Block user
• /unblock - Unblock user
• /check - Check user status

📝 Quick Replies:
• /template add <keyword> <content> - Add template
• /template list - View all templates
• /template delete <keyword> - Delete template
• /reply <keyword> - Reply with template

🔍 Query Functions:
• /history [user_id] - View conversation history
• /search <keyword> - Search messages
• /stats - View statistics

🚫 Banlist Management:
• /ban <user_id> [reason] [hours] - Ban user
• /unban <user_id> - Unban user
• /banlist - View banlist
• /import - Import banlist (reply to CSV file)
• /export - Export banlist

✏️ Message Management:
• /recall - Recall message (reply to message)

🛡️ Rate Limit Management:
• /ratelimit <user_id> <level> - Set rate limit level
• /ratelimit reset <user_id> - Reset rate limit

🔒 Verification Management:
• /verification status - View verification status
• /verification set <method> - Set verification method
• /verification enable/disable - Enable/disable verification
• /verify <user_id> - Send verification link to user
• /reverify <user_id> - Clear verification status
• /reset-verification <user_id> - Reset verification limits

🎛️ Global Settings:
• /setting view - View current settings
• /setting types <type_list> - Set allowed message types
• /setting edit <on|off> - Toggle edit notification

🛡️ Content Filtering:
• /filter list - List all filter rules
• /filter add <regex> [block|drop] [note] [priority] - Add rule
• /filter del <id> - Delete rule
• /filter toggle <id> - Enable/disable rule
• /filter priority <id> <priority> - Set priority`,

    needReply: "⚠️ Please reply to a forwarded user message.",
    noMapping:
      "❌ Cannot find original sender (data may have been cleaned or not a forwarded message).",
    sendFailed:
      "❌ Send failed. The user may have blocked the bot or deleted their account.",

    // Stats
    statsFailed: "❌ Failed to get statistics",

    // Search
    searchNoKeyword:
      "⚠️ Please provide a search keyword\nUsage: /search <keyword>",
    searchFailed: "❌ Search failed",

    // Template
    templateFormatError:
      "⚠️ Invalid format\nUsage: /template add <keyword> <content>",
    templateAdded: (keyword) => `✅ Template "${keyword}" added`,
    templateDeleted: (keyword) => `✅ Template "${keyword}" deleted`,
    templateNotFound: (keyword) => `❌ Template "${keyword}" not found`,
    templateListEmpty: "📝 No templates",
    templateListTitle: "📝 Quick Reply Template List:\n\n",
    templateListFailed: "❌ Failed to get template list",

    // Ban
    banlistEmpty: "📋 Banlist is empty",
    banlistTitle: (count) => `🚫 Banlist (${count} users):\n\n`,
    banlistFailed: "❌ Failed to get banlist",
    banned: (userId, reason, hours) => {
      const expiresText = hours ? ` (auto-unban in ${hours} hours)` : "";
      return `✅ Banned user ${userId}${expiresText}\nReason: ${reason}`;
    },
    unbanned: (userId) => `✅ Unbanned ${userId}`,
    banFailed: "❌ Ban failed, please check user ID",
    unbanFailed: "❌ Unban failed, please check user ID",
    banUsage:
      "⚠️ Usage: /ban <user_id> [reason] [hours]\nOr reply to user message with /ban [reason] [hours]",
    unbanUsage:
      "⚠️ Usage: /unban <user_id>\nOr reply to user message with /unban",

    // Export/Import
    exportFailed: "❌ Export failed",
    importNeedFile: "⚠️ Please reply to a CSV file\nFormat: telegram_id,reason",
    importFailed: "❌ Import failed",
    importSuccess: (imported, errors) =>
      `✅ Import completed\nSuccess: ${imported} users`,
    importErrors: (errors) =>
      `\nFailed: ${errors.length} entries\n\nErrors:\n${errors
        .slice(0, 5)
        .join("\n")}`,

    // Rate limit
    rateLimitReset: (userId) => `✅ Reset rate limit for user ${userId}`,
    rateLimitResetFailed: "❌ Reset failed, please check user ID",
    rateLimitSet: (userId, levelName, cooldown, perMinute, perHour) =>
      `✅ Set rate limit level for user ${userId}

Level: ${levelName}
Config:
• Cooldown: ${cooldown} seconds
• Per minute: ${perMinute} messages
• Per hour: ${perHour} messages`,
    rateLimitSetFailed: "❌ Set failed, please check parameters",
    rateLimitUsage: `⚠️ Usage:
/ratelimit <user_id> <level> - Set rate limit level
/ratelimit reset <user_id> - Reset rate limit

Level descriptions:
0 = Normal (10/min, 50/hour)
1 = Relaxed/VIP (20/min, 100/hour)
2 = Strict (5/min, 20/hour)
3 = Very Strict (1/min, 10/hour)`,
    rateLimitLevelError:
      "⚠️ Rate limit level must be between 0-3\n0=Normal, 1=Relaxed, 2=Strict, 3=Very Strict",

    // Verification management
    verificationStatusTitle: "🔒 Verification System Status\n\n",
    verificationStatusEnabled: "Status: ✅ Enabled\n",
    verificationStatusDisabled: "Status: ❌ Disabled\n",
    verificationStatusMethod: (method) => `Method: ${method}\n`,
    verificationStatusTimeout: (minutes) => `Timeout: ${minutes} minutes\n\n`,
    verificationStatusComplete: "📋 Configuration: ✅ Complete\n",
    verificationStatusIncomplete: "📋 Configuration: ❌ Incomplete\n",
    verificationStatusMissing: "Missing:\n",
    verificationStatusHint:
      "\n💡 Use /verification set <method> to switch verification method",
    verificationStatusFailed: "❌ Failed to get verification status",
    verificationMethodSet: (method) =>
      `✅ Verification method set to: ${method}\n\nUse /verification status to view details`,
    verificationMethodInvalid: `❌ Invalid verification method

Available methods:
• none - Disable verification
• math - Math verification ✨ Recommended
• quiz - Quiz verification
• turnstile - Cloudflare Turnstile
• ai - AI verification`,
    verificationMethodSetFailed: (error) =>
      `❌ Set failed: ${error}\n\nPlease configure required environment variables first`,
    verificationEnabled: "✅ Verification system enabled",
    verificationDisabled: "✅ Verification system disabled",
    verificationEnableFailed: (error) => `❌ Enable failed: ${error}`,
    verificationDisableFailed: (error) => `❌ Disable failed: ${error}`,
    verifyUserNotFound: (userId) => `❌ User ${userId} not found`,
    verifyUserAlreadyVerified: (userId) =>
      `✅ User ${userId} is already verified`,
    verifyCannotGenerate: (userId) =>
      `❌ Cannot generate verification link for user ${userId}\n\n`,
    verifyCooldown: (duration) =>
      `⏳ Verification cooldown, please wait ${duration}`,
    verifyLinkGenerated: (userId, link, minutes, attemptsRemaining) => {
      const attemptsMsg =
        attemptsRemaining !== undefined
          ? `\n💡 Attempts remaining: ${attemptsRemaining}/3 (per hour)`
          : "";
      return `✅ Verification link generated\n\nUser ID: ${userId}\nLink: ${link}\n\n⏱️ Link expires in ${minutes} minutes${attemptsMsg}`;
    },
    verifyLinkSentToUser: (userId, minutes) =>
      `🔒 Admin requests you to complete verification\n\nPlease click the link below to verify:\n\n⏱️ Link expires in ${minutes} minutes`,
    verifySendFailed:
      "❌ Failed to send verification link, please check user ID",
    reverifyCleared: (userId) =>
      `✅ Cleared verification status for user ${userId}\nUser will need to re-verify on next message`,
    reverifyFailed: "❌ Operation failed, please check user ID",
    resetVerificationDone: (userId) =>
      `✅ Reset verification limits for user ${userId}\nUser can now request a new verification link`,
    resetVerificationFailed: "❌ Operation failed, please check user ID",

    // User check
    userNotFound: "❌ User data not found",
    userInfoTitle: "👤 User Info",
    userInfoId: "ID",
    userInfoUsername: "Username",
    userInfoStatus: "Status",
    userInfoStatusBlocked: "🚫 Blocked",
    userInfoStatusNormal: "✅ Normal",
    userInfoMessageCount: "Messages",
    userInfoFirstMessage: "First Message",
    userInfoCreatedAt: "Registered",
    userInfoUpdatedAt: "Last Active",
    userInfoNote: "Note",
    userInfoRateLimitTitle: "\n\n⏱️ Rate Limit Status:",
    userInfoRateLimitLevel: "\nLevel",
    userInfoRateLimitConfig: (cooldown, perMinute, perHour) =>
      `\nConfig: ${cooldown}s cooldown, ${perMinute}/min, ${perHour}/hour`,
    userInfoRateLimitViolations: "\nViolations",
    userInfoRateLimitPenaltyUntil: "\nPenalty until",
    userInfoBanTitle: "\n\n🚫 Ban Info:",
    userInfoBanReason: "\nReason",
    userInfoBanExpires: "\nExpires",
    userInfoVerificationTitle: "\n\n🔒 Verification Status:",
    userInfoVerified: " ✅ Verified",
    userInfoNotVerified: " ❌ Not Verified",
    userInfoVerifiedAt: "\nVerified at",
    userInfoActiveLink: "\nActive Link: Yes",
    userInfoCooldownUntil: (time, duration) =>
      `\nCooldown until: ${time} (${duration})`,
    userInfoAttempts: (attempts, remaining) => {
      const remainingText =
        remaining !== undefined ? ` (${remaining}/3 remaining)` : "";
      return `\nAttempts: ${attempts}${remainingText}`;
    },

    // History
    historyEmpty: "📜 No conversation history",
    historyTitle: (count) => `📜 Conversation History (last ${count}):\n\n`,
    historyFailed: "❌ Failed to get history",
    historyIn: "👤",
    historyOut: "💬",

    // Recall
    recallAlreadyRevoked: "⚠️ This message has already been recalled",
    recallNoMessage: "❌ Cannot find message to recall",
    recallSuccess: "✅ Message recalled",
    recallFailed:
      "❌ Recall failed (may exceed 48 hours or message already deleted)",

    // Mark
    markSuccess: "✅ Message marked (feature in development)",
    unmarkSuccess: "✅ Unmarked (feature in development)",

    // Unknown command
    unknownCommand: (cmd) =>
      `❌ Unknown command: /${cmd}\n\nType /start to see available commands\nOr /template list to see quick reply templates`,

    // Menu descriptions
    menuStart: "Show help",
    menuStats: "View statistics",
    menuBanlist: "View banlist",
    menuVerification: "Verification management",
    menuFilter: "Filter rules management",
    menuSetting: "Global settings",

    // Setting commands
    settingViewTitle: "📋 Global Settings\n\n",
    settingAllowedTypes: (types: string) =>
      `✅ Allowed message types: ${types}\n`,
    settingEditNotification: (enabled: boolean) =>
      `🔔 Edit notification: ${enabled ? "Enabled" : "Disabled"}\n`,
    settingTypesSet: (types: string) =>
      `✅ Allowed message types set to: ${types}`,
    settingTypesInvalid: "❌ Invalid message type format",
    settingEditSet: (enabled: boolean) =>
      `✅ Edit notification ${enabled ? "enabled" : "disabled"}`,
    settingEditInvalid: "❌ Invalid parameter, use on or off",

    // Filter commands
    filterListTitle: (count: number) => `📋 Filter Rules (${count} total)\n\n`,
    filterListItem: (
      id: number,
      priority: number,
      mode: string,
      regex: string,
      note: string,
      active: boolean
    ) =>
      `🔹 ID: ${id} | Priority: ${priority} | Mode: ${mode}\n` +
      `   Regex: ${regex}\n` +
      `   Note: ${note}\n` +
      `   Status: ${active ? "✅ Active" : "❌ Inactive"}\n\n`,
    filterListEmpty: "📋 No filter rules",
    filterAdded: (id: number) => `✅ Filter rule added (ID: ${id})`,
    filterAddFailed: (error: string) => `❌ Failed to add: ${error}`,
    filterDeleted: (id: number) => `✅ Rule ${id} deleted`,
    filterDeleteFailed: "❌ Failed to delete",
    filterToggled: (id: number, active: boolean) =>
      `✅ Rule ${id} ${active ? "enabled" : "disabled"}`,
    filterToggleFailed: "❌ Operation failed",
    filterPrioritySet: (id: number, priority: number) =>
      `✅ Rule ${id} priority set to ${priority}`,
    filterPriorityFailed: "❌ Failed to set priority",
    filterUsage:
      "Usage:\n" +
      "/filter list - List all rules\n" +
      "/filter add <regex> [block|drop] [note] [priority] - Add rule\n" +
      "/filter del <id> - Delete rule\n" +
      "/filter toggle <id> - Toggle rule\n" +
      "/filter priority <id> <priority> - Set priority",

    // Edit notification
    editNotificationTitle: (userName: string, userId: string) =>
      `✏️ <b>User edited a message</b>\n\n` +
      `👤 User: ${userName}\n` +
      `🆔 ID: <code>${userId}</code>\n\n`,
    editNotificationOld: (content: string) =>
      `📝 <b>Original:</b>\n${content}\n\n`,
    editNotificationNew: (content: string) => `📝 <b>Edited:</b>\n${content}`,
    editNotificationCount: (count: number) => `\n\n<i>(Edit #${count})</i>`,
  },

  // User/Guest messages
  user: {
    start: `🤖 Bot Created Via Telegram PM Relay

Usage: Send a message directly to this bot to contact the admin.

Note: Admin replies may not arrive immediately, please be patient.`,

    verificationPending: `⏳ Your verification link is still valid

Please check the verification link sent to you earlier and complete verification.

If the link has expired, please try again later.`,

    verificationRequired: "❌ You need to complete verification first\n\n",
    verificationCooldown: (duration) =>
      `⏳ Verification cooldown, please try again in ${duration}`,
    verificationLimitReached:
      "⚠️ You have reached the verification limit (3 times/hour)\nPlease try again later",
    verificationStartFailed:
      "❌ Failed to start verification, please try again later",
    rateLimitedNotify: (name, id, reason) =>
      `⚠️ User triggered rate limit\nUser: ${name} (ID: ${id})\nReason: ${reason}`,
    newSession: (name, id) => `📩 *New Session*\nFrom: ${name} \\(ID: ${id}\\)`,
    highRiskWarning: (userId, reason, expires) => {
      const expiresText = expires ? `\nExpires: ${expires}` : "";
      return `⚠️ **High Risk Alert**\nUser ${userId} is on the banlist.\nReason: ${reason}${expiresText}`;
    },

    // Message type filtering
    messageTypeNotAllowed: (type: string) =>
      `❌ ${type} type messages are not allowed`,

    // Content filtering
    contentFiltered:
      "🚫 Your message contains prohibited content and cannot be sent",
  },

  // Verification messages
  verification: {
    // Math
    mathQuestion: (question) =>
      `🧮 Please answer the following question:\n\n${question}`,

    // Quiz
    quizQuestion: (question) =>
      `❓ Please answer the following question:\n\n${question}`,
    quizBank: [
      {
        question: "Which of the following is a fruit?",
        options: ["🍎 Apple", "🥬 Cabbage", "🥕 Carrot", "🧄 Garlic"],
        correct: 0,
      },
      {
        question: "How many hours are in a day?",
        options: ["12", "24", "48", "60"],
        correct: 1,
      },
      {
        question: "What sound does a cat make?",
        options: ["🐶 Woof", "🐱 Meow", "🐮 Moo", "🐑 Baa"],
        correct: 1,
      },
      {
        question: "Which direction does the sun rise from?",
        options: ["☀️ East", "🌙 West", "⭐ South", "💫 North"],
        correct: 0,
      },
      {
        question: "How many seasons are in a year?",
        options: ["2", "3", "4", "5"],
        correct: 2,
      },
      {
        question: "Which animal can fly?",
        options: ["🐘 Elephant", "🦁 Lion", "🦅 Eagle", "🐟 Fish"],
        correct: 2,
      },
      {
        question: "What color is the sky usually?",
        options: ["🔴 Red", "🔵 Blue", "🟢 Green", "🟡 Yellow"],
        correct: 1,
      },
      {
        question: "At what temperature does water freeze?",
        options: ["0°C", "10°C", "20°C", "100°C"],
        correct: 0,
      },
      {
        question: "How many days are in a week?",
        options: ["5 days", "6 days", "7 days", "8 days"],
        correct: 2,
      },
      {
        question: "What does the Earth revolve around?",
        options: ["🌙 Moon", "☀️ Sun", "⭐ Stars", "🪐 Saturn"],
        correct: 1,
      },
    ],

    // Turnstile
    turnstileMessage: (minutes) =>
      `🔒 First-time users need to complete verification\n\n⏱️ Link expires in ${minutes} minutes`,
    turnstileButton: "🔐 Click to verify",
    turnstileChallenge: "Please complete Cloudflare Turnstile verification",

    // AI
    aiQuestion: (question) =>
      `🤖 Please answer the following question:\n\n${question}`,
    aiPrompt: `Generate a simple common-sense question for human verification.

Requirements:
1. The question must be simple and clear, answerable by anyone
2. The question should be common knowledge, no expertise required
3. Provide 4 options with only 1 correct answer
4. The 3 wrong options should be obviously wrong but not absurd

Example question types:
- Color recognition ("What color is the sky usually?")
- Animal characteristics ("Which animal can fly?")
- Basic knowledge ("How many seasons are in a year?")
- Simple physics ("Which direction do objects fall?")

Please return in JSON format with question, options (array of 4), and correct (index 0-3).`,

    // Success messages
    successMath:
      "🎉 Correct!\n\nYou have passed verification and can now use the bot normally.",
    successQuiz:
      "🎉 Correct!\n\nYou have passed verification and can now use the bot normally.",
    successAI:
      "🎉 Great! Correct answer.\n\nYou have passed verification and can now use the bot normally.",
    successWelcome: "🎉 Welcome! You can now send messages.",
    successNotification:
      "🎉 Verification successful!\n\nYour account has been verified and you can now use the bot normally.",

    // Error messages
    errorMismatch: "❌ Verification data mismatch",
    errorNoSession: "❌ Verification session does not exist, please start over",
    errorAlreadyVerified: "✅ You have already completed verification",
    errorExpired: "❌ Verification expired, please start over",
    errorMathWrong: "❌ Calculation error\n\n",
    errorQuizWrong: "❌ Wrong answer\n\n",
    errorAIWrong: "❌ Incorrect answer\n\n",
    errorCorrectAnswer: (answer) => `💡 The correct answer is: ${answer}\n\n`,
    errorRetry:
      "🔄 Please send a message again to get a new verification question",
    errorProcessing:
      "❌ Verification processing failed, please try again later",

    // Link verification (web page)
    linkInvalid:
      "<h1>❌ Invalid Verification Link</h1>\n<p>This verification link does not exist or has been used.</p>\n<p>Please send a new message to the bot to get a new verification link.</p>",
    linkAlreadyVerified:
      "<h1>✅ Already Verified</h1>\n<p>Your account has been verified and you can use the bot directly.</p>",
    linkExpired:
      "<h1>⏰ Verification Link Expired</h1>\n<p>This verification link has expired. Please send a new message to the bot to get a new verification link.</p>",
    linkPageFailed: "<h1>❌ Failed to Load Verification Page</h1>",
    linkMissingToken: "Missing verification token",
    linkVerifyFailed: "Verification failed, please try again",
    linkServerError: "Server error",
  },

  // Rate limit messages
  rateLimit: {
    firstWarning: (cooldown, perMinute) => `⚠️ Sending messages too fast

You have sent too many messages in a short time, please try again later.

Current limits:
• At least ${cooldown} seconds between messages
• Maximum ${perMinute} messages per minute

Please wait 30 seconds before retrying.`,

    secondWarning: (unlockTime) => `🚫 Rate limited

You have been rate limited for sending messages too quickly.

Limit duration: 5 minutes
Unlock time: ${unlockTime}

Note: Repeated violations may result in longer restrictions.`,

    thirdWarning: (unlockTime) => `🔒 Strict rate limit

You have repeatedly violated message sending rules and have been strictly rate limited.

Limit duration: 30 minutes
Unlock time: ${unlockTime}

If you have questions, please contact the admin.`,

    inPenalty: (seconds) => `User in penalty period (wait ${seconds} seconds)`,
    cooldownNotReached: (seconds) =>
      `Cooldown not reached (wait ${seconds} seconds)`,
    perMinuteExceeded: (limit) =>
      `Exceeded per-minute limit (${limit} messages)`,
    perHourExceeded: (limit) => `Exceeded per-hour limit (${limit} messages)`,
  },

  // Stats format
  stats: {
    title: "📊 Bot Statistics (Last 24 Hours)",
    separator: "━━━━━━━━━━━━━━━━━━",
    received: (count) => `📨 Received: ${count} messages`,
    sent: (count) => `📤 Sent: ${count} messages`,
    activeUsers: (count) => `👥 Active Users: ${count}`,
    totalTitle: "\n📈 Total Data",
    totalUsers: (count) => `Total Users: ${count.toLocaleString()}`,
    totalMessages: (count) => `Total Messages: ${count.toLocaleString()}`,
    banlist: (count) => `🚫 Banlist: ${count} users`,
  },

  // Search format
  search: {
    noResults: "🔍 No matching messages found",
    resultsTitle: (count) => `🔍 Found ${count} matching messages:\n\n`,
    received: "Received",
    sent: "Sent",
  },

  // Config service messages
  config: {
    dbOperationFailed: "Database operation failed",
    missingTurnstile: "Missing Turnstile configuration",
    missingAI: "Missing AI verification configuration",
    unknownMethod: "Unknown verification method",
  },

  // Fraud service messages
  fraud: {
    banFailed: "Ban failed",
    unbanFailed: "Unban failed",
    bulkImport: "Bulk import",
    rowFormatError: (row) => `Row ${row}: format error`,
  },

  // Verification service messages
  verificationService: {
    startFailed: "Failed to start verification",
    userAlreadyVerified: "User already verified",
    cooldownMessage: (duration) =>
      `Verification cooldown, please wait ${duration}`,
    limitReached: "Verification limit reached (3 times/hour)",
    invalidLink: "Invalid verification link",
    linkExpired: "Verification link expired, please get a new one",
  },

  // Duration format
  duration: {
    seconds: (n) => `${n} seconds`,
    minutes: (n) => `${n} minutes`,
    hours: (n) => `${n} hours`,
    hoursMinutes: (h, m) => (m > 0 ? `${h} hours ${m} minutes` : `${h} hours`),
  },

  // HTML verification page
  html: {
    pageTitle: "Human Verification - Telegram Bot",
    pageHeading: "Human Verification",
    pageDescription:
      "First-time users need to complete human verification before using the bot.",
    submitButton: "Complete Verification",
    submitButtonLoading: "Verifying...",
    submitButtonRetry: "Retry",
    errorNoToken: "Please complete human verification first",
    errorVerifyFailed: "Verification failed, please try again",
    errorNetwork: "Network error, please check your connection and try again",
    successMessage: "✅ Verification successful! Redirecting...",
  },

  // Method names for display
  methodNames: {
    none: "No Verification",
    math: "Math Verification",
    quiz: "Quiz Verification",
    turnstile: "Cloudflare Turnstile",
    ai: "AI Verification",
  },

  // Rate limit level names
  rateLimitLevels: ["Normal", "Relaxed (VIP)", "Strict", "Very Strict"],

  // Misc
  misc: {
    expiresAt: "Expires",
    reason: "Reason",
    notSpecified: "Not specified",
    permanentBan: "Permanent",
    temporaryBan: (hours) => `${hours} hours`,
    moreItems: (count) => `...and ${count} more`,
    unknown: "Unknown",
    none: "None",
  },
};
