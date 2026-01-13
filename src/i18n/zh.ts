/**
 * Chinese Language Pack / 中文语言包
 */
import type { Messages } from './types';

export const zh: Messages = {
  // Common messages
  common: {
    yes: '是',
    no: '否',
    error: '错误',
    success: '成功',
    failed: '失败',
    unknown: '未知',
    notFound: '未找到',
  },

  // Admin messages
  admin: {
    start: `👋 Telegram PM Relay 管理端已就绪

当前管理员 ID: {ADMIN_UID}

📋 基本操作：
• 回复用户转发来的消息可直接回复
• /block - 屏蔽用户
• /unblock - 解除屏蔽
• /check - 查看用户状态

📝 快捷回复：
• /template add <关键词> <内容> - 添加模板
• /template list - 查看所有模板
• /template delete <关键词> - 删除模板
• /reply <关键词> - 使用模板回复

🔍 查询功能：
• /history [user_id] - 查看对话历史
• /search <关键词> - 搜索消息
• /stats - 查看统计信息

🚫 黑名单管理：
• /ban <user_id> [原因] [小时] - 封禁用户
• /unban <user_id> - 解封用户
• /banlist - 查看黑名单
• /import - 导入黑名单（回复 CSV 文件）
• /export - 导出黑名单

✏️ 消息管理：
• /recall - 撤回消息（回复要撤回的消息）

🛡️ 限流管理：
• /ratelimit <user_id> <level> - 设置限流等级
• /ratelimit reset <user_id> - 重置限流状态

🔒 验证管理：
• /verification status - 查看验证系统状态
• /verification set <方式> - 设置验证方式
• /verification enable/disable - 启用/禁用验证
• /verify <user_id> - 发送验证链接给用户
• /reverify <user_id> - 清除验证状态
• /reset-verification <user_id> - 重置验证限制`,

    needReply: '⚠️ 请回复一条用户转发过来的消息。',
    noMapping: '❌ 找不到原始发送者（可能数据已清理或非转发消息）。',
    sendFailed: '❌ 发送失败。该用户可能已封锁机器人或注销账号。',

    // Stats
    statsFailed: '❌ 获取统计信息失败',

    // Search
    searchNoKeyword: '⚠️ 请提供搜索关键词\n用法: /search <关键词>',
    searchFailed: '❌ 搜索失败',

    // Template
    templateFormatError: '⚠️ 格式错误\n用法: /template add <关键词> <内容>',
    templateAdded: (keyword) => `✅ 模板 "${keyword}" 已添加`,
    templateDeleted: (keyword) => `✅ 模板 "${keyword}" 已删除`,
    templateNotFound: (keyword) => `❌ 未找到模板 "${keyword}"`,
    templateListEmpty: '📝 暂无模板',
    templateListTitle: '📝 快捷回复模板列表：\n\n',
    templateListFailed: '❌ 获取模板列表失败',

    // Ban
    banlistEmpty: '📋 黑名单为空',
    banlistTitle: (count) => `🚫 黑名单 (${count} 人):\n\n`,
    banlistFailed: '❌ 获取黑名单失败',
    banned: (userId, reason, hours) => {
      const expiresText = hours ? ` (${hours} 小时后自动解封)` : '';
      return `✅ 已封禁用户 ${userId}${expiresText}\n原因: ${reason}`;
    },
    unbanned: (userId) => `✅ 已解除封禁 ${userId}`,
    banFailed: '❌ 封禁失败，请检查用户 ID',
    unbanFailed: '❌ 解封失败，请检查用户 ID',
    banUsage: '⚠️ 用法：/ban <user_id> [原因] [小时]\n或回复用户消息使用 /ban [原因] [小时]',
    unbanUsage: '⚠️ 用法：/unban <user_id>\n或回复用户消息使用 /unban',

    // Export/Import
    exportFailed: '❌ 导出失败',
    importNeedFile: '⚠️ 请回复一个 CSV 文件\n格式: telegram_id,reason',
    importFailed: '❌ 导入失败',
    importSuccess: (imported, errors) => `✅ 导入完成\n成功: ${imported} 人`,
    importErrors: (errors) => `\n失败: ${errors.length} 条\n\n错误:\n${errors.slice(0, 5).join('\n')}`,

    // Rate limit
    rateLimitReset: (userId) => `✅ 已重置用户 ${userId} 的限流状态`,
    rateLimitResetFailed: '❌ 重置失败，请检查用户 ID',
    rateLimitSet: (userId, levelName, cooldown, perMinute, perHour) =>
      `✅ 已设置用户 ${userId} 的限流等级

等级：${levelName}
配置：
• 冷却时间：${cooldown} 秒
• 每分钟：${perMinute} 条
• 每小时：${perHour} 条`,
    rateLimitSetFailed: '❌ 设置失败，请检查参数',
    rateLimitUsage: `⚠️ 用法：
/ratelimit <user_id> <level> - 设置限流等级
/ratelimit reset <user_id> - 重置限流状态

等级说明：
0 = 正常 (10条/分, 50条/时)
1 = 宽松/VIP (20条/分, 100条/时)
2 = 严格 (5条/分, 20条/时)
3 = 极严格 (1条/分, 10条/时)`,
    rateLimitLevelError: '⚠️ 限流等级必须在 0-3 之间\n0=正常, 1=宽松, 2=严格, 3=极严格',

    // Verification management
    verificationStatusTitle: '🔒 验证系统状态\n\n',
    verificationStatusEnabled: '状态：✅ 已启用\n',
    verificationStatusDisabled: '状态：❌ 已禁用\n',
    verificationStatusMethod: (method) => `方式：${method}\n`,
    verificationStatusTimeout: (minutes) => `超时：${minutes} 分钟\n\n`,
    verificationStatusComplete: '📋 配置完整性：✅ 完整\n',
    verificationStatusIncomplete: '📋 配置完整性：❌ 缺失\n',
    verificationStatusMissing: '缺少配置：\n',
    verificationStatusHint: '\n💡 使用 /verification set <方式> 切换验证方式',
    verificationStatusFailed: '❌ 获取验证状态失败',
    verificationMethodSet: (method) => `✅ 验证方式已设置为：${method}\n\n使用 /verification status 查看详情`,
    verificationMethodInvalid: `❌ 无效的验证方式

可用方式：
• none - 禁用验证
• math - 算术题验证 ✨ 推荐
• quiz - 题库问答
• turnstile - Cloudflare Turnstile
• ai - AI 智能验证`,
    verificationMethodSetFailed: (error) => `❌ 设置失败：${error}\n\n请先配置所需的环境变量`,
    verificationEnabled: '✅ 验证系统已启用',
    verificationDisabled: '✅ 验证系统已禁用',
    verificationEnableFailed: (error) => `❌ 启用失败：${error}`,
    verificationDisableFailed: (error) => `❌ 禁用失败：${error}`,
    verifyUserNotFound: (userId) => `❌ 用户 ${userId} 不存在`,
    verifyUserAlreadyVerified: (userId) => `✅ 用户 ${userId} 已经验证过了`,
    verifyCannotGenerate: (userId) => `❌ 无法为用户 ${userId} 生成验证链接\n\n`,
    verifyCooldown: (duration) => `⏳ 验证冷却中，还需等待 ${duration}`,
    verifyLinkGenerated: (userId, link, minutes, attemptsRemaining) => {
      const attemptsMsg = attemptsRemaining !== undefined ? `\n💡 剩余尝试次数：${attemptsRemaining}/3（每小时）` : '';
      return `✅ 验证链接已生成\n\n用户 ID: ${userId}\n链接：${link}\n\n⏱️ 链接将在 ${minutes} 分钟后过期${attemptsMsg}`;
    },
    verifyLinkSentToUser: (userId, minutes) =>
      `🔒 管理员要求您进行人机验证\n\n请点击下方链接完成验证：\n\n⏱️ 链接将在 ${minutes} 分钟后过期`,
    verifySendFailed: '❌ 发送验证链接失败，请检查用户 ID',
    reverifyCleared: (userId) => `✅ 已清除用户 ${userId} 的验证状态\n用户下次发送消息时需要重新验证`,
    reverifyFailed: '❌ 操作失败，请检查用户 ID',
    resetVerificationDone: (userId) => `✅ 已重置用户 ${userId} 的验证限制\n用户可以立即请求新的验证链接`,
    resetVerificationFailed: '❌ 操作失败，请检查用户 ID',

    // User check
    userNotFound: '❌ 用户数据不存在',
    userInfoTitle: '👤 用户信息',
    userInfoId: 'ID',
    userInfoUsername: 'Username',
    userInfoStatus: '状态',
    userInfoStatusBlocked: '🚫 已屏蔽',
    userInfoStatusNormal: '✅ 正常',
    userInfoMessageCount: '消息数',
    userInfoFirstMessage: '首次消息',
    userInfoCreatedAt: '注册时间',
    userInfoUpdatedAt: '最后活跃',
    userInfoNote: '备注',
    userInfoRateLimitTitle: '\n\n⏱️ 限流状态:',
    userInfoRateLimitLevel: '\n等级',
    userInfoRateLimitConfig: (cooldown, perMinute, perHour) =>
      `\n配置: ${cooldown}秒冷却, ${perMinute}条/分, ${perHour}条/时`,
    userInfoRateLimitViolations: '\n违规次数',
    userInfoRateLimitPenaltyUntil: '\n惩罚至',
    userInfoBanTitle: '\n\n🚫 黑名单信息:',
    userInfoBanReason: '\n原因',
    userInfoBanExpires: '\n过期时间',
    userInfoVerificationTitle: '\n\n🔒 验证状态:',
    userInfoVerified: ' ✅ 已验证',
    userInfoNotVerified: ' ❌ 未验证',
    userInfoVerifiedAt: '\n验证时间',
    userInfoActiveLink: '\n活跃链接: 是',
    userInfoCooldownUntil: (time, duration) => `\n冷却至: ${time} (${duration})`,
    userInfoAttempts: (attempts, remaining) => {
      const remainingText = remaining !== undefined ? ` (剩余 ${remaining}/3)` : '';
      return `\n尝试次数: ${attempts}${remainingText}`;
    },

    // History
    historyEmpty: '📜 暂无对话历史',
    historyTitle: (count) => `📜 对话历史 (最近 ${count} 条):\n\n`,
    historyFailed: '❌ 获取历史失败',
    historyIn: '👤',
    historyOut: '💬',

    // Recall
    recallAlreadyRevoked: '⚠️ 该消息已撤回',
    recallNoMessage: '❌ 无法找到要撤回的消息',
    recallSuccess: '✅ 消息已撤回',
    recallFailed: '❌ 撤回失败（可能超过 48 小时或消息已删除）',

    // Mark
    markSuccess: '✅ 消息已标记（功能开发中）',
    unmarkSuccess: '✅ 已取消标记（功能开发中）',

    // Unknown command
    unknownCommand: (cmd) => `❌ 未知命令: /${cmd}\n\n请输入 /start 查看可用命令\n或 /template list 查看快捷回复模板`,

    // Menu descriptions
    menuStart: '显示帮助信息',
    menuStats: '查看统计信息',
    menuBanlist: '查看黑名单',
    menuVerification: '验证系统管理',
  },

  // User/Guest messages
  user: {
    start: `🤖 Bot Created Via Telegram PM Relay

使用方法：直接发送消息给本机器人即可联系管理员。

注意：管理员回复可能不会立即到达，请耐心等待。`,

    verificationPending: `⏳ 您的验证链接仍然有效

请检查之前发送给您的验证链接并完成人机验证。

如果链接已过期，请稍后重试。`,

    verificationRequired: '❌ 您需要先完成验证\n\n',
    verificationCooldown: (duration) => `⏳ 验证冷却中，请在 ${duration} 后重试`,
    verificationLimitReached: '⚠️ 您已达到验证次数上限（3次/小时）\n请稍后再试',
    verificationStartFailed: '❌ 启动验证失败，请稍后重试',
    rateLimitedNotify: (name, id, reason) => `⚠️ 用户触发限流\n用户: ${name} (ID: ${id})\n原因：${reason}`,
    newSession: (name, id) => `📩 *新会话*\n来自: ${name} \\(ID: ${id}\\)`,
    highRiskWarning: (userId, reason, expires) => {
      const expiresText = expires ? `\n过期时间：${expires}` : '';
      return `⚠️ **高风险提醒**\n用户 ${userId} 在黑名单中。\n原因：${reason}${expiresText}`;
    },
  },

  // Verification messages
  verification: {
    // Math
    mathQuestion: (question) => `🧮 请回答以下问题：\n\n${question}`,

    // Quiz
    quizQuestion: (question) => `❓ 请回答以下问题：\n\n${question}`,
    quizBank: [
      {
        question: '下列哪个是水果？',
        options: ['🍎 苹果', '🥬 白菜', '🥕 萝卜', '🧄 大蒜'],
        correct: 0,
      },
      {
        question: '一天有多少小时？',
        options: ['12', '24', '48', '60'],
        correct: 1,
      },
      {
        question: '猫的叫声是？',
        options: ['🐶 汪汪', '🐱 喵喵', '🐮 哞哞', '🐑 咩咩'],
        correct: 1,
      },
      {
        question: '太阳从哪边升起？',
        options: ['☀️ 东方', '🌙 西方', '⭐ 南方', '💫 北方'],
        correct: 0,
      },
      {
        question: '一年有几个季节？',
        options: ['2个', '3个', '4个', '5个'],
        correct: 2,
      },
      {
        question: '哪种动物会飞？',
        options: ['🐘 大象', '🦁 狮子', '🦅 老鹰', '🐟 鱼'],
        correct: 2,
      },
      {
        question: '天空通常是什么颜色？',
        options: ['🔴 红色', '🔵 蓝色', '🟢 绿色', '🟡 黄色'],
        correct: 1,
      },
      {
        question: '水在什么温度会结冰？',
        options: ['0°C', '10°C', '20°C', '100°C'],
        correct: 0,
      },
      {
        question: '一周有几天？',
        options: ['5天', '6天', '7天', '8天'],
        correct: 2,
      },
      {
        question: '地球围绕什么转？',
        options: ['🌙 月亮', '☀️ 太阳', '⭐ 星星', '🪐 土星'],
        correct: 1,
      },
    ],

    // Turnstile
    turnstileMessage: (minutes) => `🔒 首次使用需要进行人机验证\n\n⏱️ 链接将在 ${minutes} 分钟后过期`,
    turnstileButton: '🔐 点击进行验证',
    turnstileChallenge: '请完成 Cloudflare Turnstile 验证',

    // AI
    aiQuestion: (question) => `🤖 请回答以下问题：\n\n${question}`,
    aiPrompt: `生成一个简单的常识性问题用于验证用户是真人。

要求：
1. 问题必须简单明了，普通人都能回答
2. 问题应该是常识性的，无需专业知识
3. 提供4个选项，只有1个正确答案
4. 3个错误选项应该明显错误，但不要太离谱

示例问题类型：
- 颜色识别（"天空通常是什么颜色？"）
- 动物特征（"哪种动物会飞？"）
- 基本常识（"一年有几个季节？"）
- 简单物理（"物体从高处会往哪里掉？"）

请以 JSON 格式返回，包含 question（问题）、options（4个选项的数组）、correct（正确答案的索引0-3）。`,

    // Success messages
    successMath: '🎉 回答正确！\n\n您已通过验证，现在可以正常使用了。',
    successQuiz: '🎉 答对了！\n\n您已通过验证，现在可以正常使用了。',
    successAI: '🎉 很好！回答正确\n\n您已通过验证，现在可以正常使用了。',
    successWelcome: '🎉 欢迎！现在您可以发送消息了。',
    successNotification: '🎉 验证成功！\n\n您的账号已验证通过，现在可以正常使用了。',

    // Error messages
    errorMismatch: '❌ 验证数据不匹配',
    errorNoSession: '❌ 验证会话不存在，请重新开始',
    errorAlreadyVerified: '✅ 您已经完成验证',
    errorExpired: '❌ 验证已过期，请重新开始',
    errorMathWrong: '❌ 计算错误\n\n',
    errorQuizWrong: '❌ 答案错误\n\n',
    errorAIWrong: '❌ 回答不正确\n\n',
    errorCorrectAnswer: (answer) => `💡 正确答案是：${answer}\n\n`,
    errorRetry: '🔄 请重新发送消息获取新的验证题目',
    errorProcessing: '❌ 验证处理失败，请稍后重试',

    // Link verification (web page)
    linkInvalid: '<h1>❌ 验证链接无效</h1>\n<p>该验证链接不存在或已被使用。</p>\n<p>请重新向机器人发送消息获取新的验证链接。</p>',
    linkAlreadyVerified: '<h1>✅ 您已完成验证</h1>\n<p>您的账号已经验证通过，可以直接使用机器人。</p>',
    linkExpired: '<h1>⏰ 验证链接已过期</h1>\n<p>该验证链接已过期，请重新向机器人发送消息获取新的验证链接。</p>',
    linkPageFailed: '<h1>❌ 验证页面加载失败</h1>',
    linkMissingToken: '缺少验证 token',
    linkVerifyFailed: '人机验证失败，请重试',
    linkServerError: '服务器错误',
  },

  // Rate limit messages
  rateLimit: {
    firstWarning: (cooldown, perMinute) => `⚠️ 消息发送过快

您在短时间内发送了过多消息，请稍后再试。

当前限制：
• 每条消息间隔至少 ${cooldown} 秒
• 每分钟最多 ${perMinute} 条消息

请等待 30 秒后重试。`,

    secondWarning: (unlockTime) => `🚫 已触发限流

您已多次发送过快的消息，已被限流。

限流时长：5 分钟
解除时间：${unlockTime}

提示：频繁违规可能导致更长时间的限制。`,

    thirdWarning: (unlockTime) => `🔒 严格限流

您频繁违反消息发送规则，已被严格限流。

限流时长：30 分钟
解除时间：${unlockTime}

如有疑问，请联系管理员。`,

    inPenalty: (seconds) => `用户在惩罚期内（还需等待 ${seconds} 秒）`,
    cooldownNotReached: (seconds) => `冷却时间未到（还需等待 ${seconds} 秒）`,
    perMinuteExceeded: (limit) => `超过每分钟限制（${limit}条）`,
    perHourExceeded: (limit) => `超过每小时限制（${limit}条）`,
  },

  // Stats format
  stats: {
    title: '📊 机器人统计 (最近 24 小时)',
    separator: '━━━━━━━━━━━━━━━━━━',
    received: (count) => `📨 收到消息: ${count} 条`,
    sent: (count) => `📤 发送消息: ${count} 条`,
    activeUsers: (count) => `👥 活跃用户: ${count} 人`,
    totalTitle: '\n📈 总体数据',
    totalUsers: (count) => `总用户数: ${count.toLocaleString()}`,
    totalMessages: (count) => `总消息数: ${count.toLocaleString()}`,
    banlist: (count) => `🚫 黑名单: ${count} 人`,
  },

  // Search format
  search: {
    noResults: '🔍 未找到匹配的消息',
    resultsTitle: (count) => `🔍 找到 ${count} 条匹配的消息：\n\n`,
    received: '收到',
    sent: '发送',
  },

  // Config service messages
  config: {
    dbOperationFailed: '数据库操作失败',
    missingTurnstile: '缺少 Turnstile 配置',
    missingAI: '缺少 AI 验证配置',
    unknownMethod: '未知的验证方式',
  },

  // Fraud service messages
  fraud: {
    banFailed: '封禁失败',
    unbanFailed: '解封失败',
    bulkImport: '批量导入',
    rowFormatError: (row) => `行 ${row}: 格式错误`,
  },

  // Verification service messages
  verificationService: {
    startFailed: '启动验证失败',
    userAlreadyVerified: '用户已验证',
    cooldownMessage: (duration) => `验证冷却中，还需等待 ${duration}`,
    limitReached: '验证次数已达上限（3次/小时）',
    invalidLink: '无效的验证链接',
    linkExpired: '验证链接已过期，请重新获取',
  },

  // Duration format
  duration: {
    seconds: (n) => `${n} 秒`,
    minutes: (n) => `${n} 分钟`,
    hours: (n) => `${n} 小时`,
    hoursMinutes: (h, m) => m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`,
  },

  // HTML verification page
  html: {
    pageTitle: '人机验证 - Telegram Bot',
    pageHeading: '人机验证',
    pageDescription: '首次使用需要进行人机验证，完成后即可正常使用机器人。',
    submitButton: '完成验证',
    submitButtonLoading: '验证中...',
    submitButtonRetry: '重试',
    errorNoToken: '请先完成人机验证',
    errorVerifyFailed: '验证失败，请重试',
    errorNetwork: '网络错误，请检查网络连接后重试',
    successMessage: '✅ 验证成功！正在跳转...',
  },

  // Method names for display
  methodNames: {
    none: '无验证',
    math: '算术题验证',
    quiz: '题库问答',
    turnstile: 'Cloudflare Turnstile',
    ai: 'AI 智能验证',
  },

  // Rate limit level names
  rateLimitLevels: ['正常', '宽松(VIP)', '严格', '极严格'],

  // Misc
  misc: {
    expiresAt: '过期',
    reason: '原因',
    notSpecified: '未注明',
    permanentBan: '永久',
    temporaryBan: (hours) => `${hours} 小时`,
    moreItems: (count) => `...还有 ${count} 人`,
    unknown: '未知',
    none: '无',
  },
};
