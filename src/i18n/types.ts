/**
 * i18n Type Definitions
 * Enforces consistency between language packs
 */

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

/**
 * Messages interface - all language packs must implement this
 */
export interface Messages {
  // Common messages
  common: {
    yes: string;
    no: string;
    error: string;
    success: string;
    failed: string;
    unknown: string;
    notFound: string;
  };

  // Admin messages
  admin: {
    start: string;
    needReply: string;
    noMapping: string;
    sendFailed: string;
    // Stats
    statsFailed: string;
    // Search
    searchNoKeyword: string;
    searchFailed: string;
    // Template
    templateFormatError: string;
    templateAdded: (keyword: string) => string;
    templateDeleted: (keyword: string) => string;
    templateNotFound: (keyword: string) => string;
    templateListEmpty: string;
    templateListTitle: string;
    templateListFailed: string;
    // Ban
    banlistEmpty: string;
    banlistTitle: (count: number) => string;
    banlistFailed: string;
    banned: (userId: string, reason: string, hours?: number) => string;
    unbanned: (userId: string) => string;
    banFailed: string;
    unbanFailed: string;
    banUsage: string;
    unbanUsage: string;
    // Export/Import
    exportFailed: string;
    importNeedFile: string;
    importFailed: string;
    importSuccess: (imported: number, errors: number) => string;
    importErrors: (errors: string[]) => string;
    // Rate limit
    rateLimitReset: (userId: string) => string;
    rateLimitResetFailed: string;
    rateLimitSet: (userId: string, levelName: string, cooldown: number, perMinute: number, perHour: number) => string;
    rateLimitSetFailed: string;
    rateLimitUsage: string;
    rateLimitLevelError: string;
    // Verification management
    verificationStatusTitle: string;
    verificationStatusEnabled: string;
    verificationStatusDisabled: string;
    verificationStatusMethod: (method: string) => string;
    verificationStatusTimeout: (minutes: number) => string;
    verificationStatusComplete: string;
    verificationStatusIncomplete: string;
    verificationStatusMissing: string;
    verificationStatusHint: string;
    verificationStatusFailed: string;
    verificationMethodSet: (method: string) => string;
    verificationMethodInvalid: string;
    verificationMethodSetFailed: (error: string) => string;
    verificationEnabled: string;
    verificationDisabled: string;
    verificationEnableFailed: (error: string) => string;
    verificationDisableFailed: (error: string) => string;
    verifyUserNotFound: (userId: string) => string;
    verifyUserAlreadyVerified: (userId: string) => string;
    verifyCannotGenerate: (userId: string) => string;
    verifyCooldown: (duration: string) => string;
    verifyLinkGenerated: (userId: string, link: string, minutes: number, attemptsRemaining?: number) => string;
    verifyLinkSentToUser: (userId: string, minutes: number) => string;
    verifySendFailed: string;
    reverifyCleared: (userId: string) => string;
    reverifyFailed: string;
    resetVerificationDone: (userId: string) => string;
    resetVerificationFailed: string;
    // User check
    userNotFound: string;
    userInfoTitle: string;
    userInfoId: string;
    userInfoUsername: string;
    userInfoStatus: string;
    userInfoStatusBlocked: string;
    userInfoStatusNormal: string;
    userInfoMessageCount: string;
    userInfoFirstMessage: string;
    userInfoCreatedAt: string;
    userInfoUpdatedAt: string;
    userInfoNote: string;
    userInfoRateLimitTitle: string;
    userInfoRateLimitLevel: string;
    userInfoRateLimitConfig: (cooldown: number, perMinute: number, perHour: number) => string;
    userInfoRateLimitViolations: string;
    userInfoRateLimitPenaltyUntil: string;
    userInfoBanTitle: string;
    userInfoBanReason: string;
    userInfoBanExpires: string;
    userInfoVerificationTitle: string;
    userInfoVerified: string;
    userInfoNotVerified: string;
    userInfoVerifiedAt: string;
    userInfoActiveLink: string;
    userInfoCooldownUntil: (time: string, duration: string) => string;
    userInfoAttempts: (attempts: number, remaining?: number) => string;
    // History
    historyEmpty: string;
    historyTitle: (count: number) => string;
    historyFailed: string;
    historyIn: string;
    historyOut: string;
    // Recall
    recallAlreadyRevoked: string;
    recallNoMessage: string;
    recallSuccess: string;
    recallFailed: string;
    // Mark
    markSuccess: string;
    unmarkSuccess: string;
    // Unknown command
    unknownCommand: (cmd: string) => string;
    // Menu descriptions
    menuStart: string;
    menuStats: string;
    menuBanlist: string;
    menuVerification: string;
    menuFilter: string;
    menuSetting: string;
    // Setting commands
    settingViewTitle: string;
    settingAllowedTypes: (types: string) => string;
    settingEditNotification: (enabled: boolean) => string;
    settingTypesSet: (types: string) => string;
    settingTypesInvalid: string;
    settingEditSet: (enabled: boolean) => string;
    settingEditInvalid: string;
    // Filter commands
    filterListTitle: (count: number) => string;
    filterListItem: (id: number, priority: number, mode: string, regex: string, note: string, active: boolean) => string;
    filterListEmpty: string;
    filterAdded: (id: number) => string;
    filterAddFailed: (error: string) => string;
    filterDeleted: (id: number) => string;
    filterDeleteFailed: string;
    filterToggled: (id: number, active: boolean) => string;
    filterToggleFailed: string;
    filterPrioritySet: (id: number, priority: number) => string;
    filterPriorityFailed: string;
    filterUsage: string;
    // Edit notification
    editNotificationTitle: (userName: string, userId: string) => string;
    editNotificationOld: (content: string) => string;
    editNotificationNew: (content: string) => string;
    editNotificationCount: (count: number) => string;
  };

  // User/Guest messages
  user: {
    start: string;
    verificationPending: string;
    verificationRequired: string;
    verificationCooldown: (duration: string) => string;
    verificationLimitReached: string;
    verificationStartFailed: string;
    rateLimitedNotify: (name: string, id: string, reason: string) => string;
    newSession: (name: string, id: string) => string;
    highRiskWarning: (userId: string, reason: string, expires?: string) => string;
    // Message type filtering
    messageTypeNotAllowed: (type: string) => string;
    // Content filtering
    contentFiltered: string;
  };

  // Verification messages
  verification: {
    // Math
    mathQuestion: (question: string) => string;
    // Quiz
    quizQuestion: (question: string) => string;
    quizBank: QuizQuestion[];
    // Turnstile
    turnstileMessage: (minutes: number) => string;
    turnstileButton: string;
    turnstileChallenge: string;
    // AI
    aiQuestion: (question: string) => string;
    aiPrompt: string;
    // Success messages
    successMath: string;
    successQuiz: string;
    successAI: string;
    successWelcome: string;
    successNotification: string;
    // Error messages
    errorMismatch: string;
    errorNoSession: string;
    errorAlreadyVerified: string;
    errorExpired: string;
    errorMathWrong: string;
    errorQuizWrong: string;
    errorAIWrong: string;
    errorCorrectAnswer: (answer: string) => string;
    errorRetry: string;
    errorProcessing: string;
    // Link verification (web page)
    linkInvalid: string;
    linkAlreadyVerified: string;
    linkExpired: string;
    linkPageFailed: string;
    linkMissingToken: string;
    linkVerifyFailed: string;
    linkServerError: string;
  };

  // Rate limit messages
  rateLimit: {
    firstWarning: (cooldown: number, perMinute: number) => string;
    secondWarning: (unlockTime: string) => string;
    thirdWarning: (unlockTime: string) => string;
    inPenalty: (seconds: number) => string;
    cooldownNotReached: (seconds: number) => string;
    perMinuteExceeded: (limit: number) => string;
    perHourExceeded: (limit: number) => string;
  };

  // Stats format
  stats: {
    title: string;
    separator: string;
    received: (count: number) => string;
    sent: (count: number) => string;
    activeUsers: (count: number) => string;
    totalTitle: string;
    totalUsers: (count: number) => string;
    totalMessages: (count: number) => string;
    banlist: (count: number) => string;
  };

  // Search format
  search: {
    noResults: string;
    resultsTitle: (count: number) => string;
    received: string;
    sent: string;
  };

  // Config service messages
  config: {
    dbOperationFailed: string;
    missingTurnstile: string;
    missingAI: string;
    unknownMethod: string;
  };

  // Fraud service messages
  fraud: {
    banFailed: string;
    unbanFailed: string;
    bulkImport: string;
    rowFormatError: (row: number) => string;
  };

  // Verification service messages
  verificationService: {
    startFailed: string;
    userAlreadyVerified: string;
    cooldownMessage: (duration: string) => string;
    limitReached: string;
    invalidLink: string;
    linkExpired: string;
  };

  // Duration format
  duration: {
    seconds: (n: number) => string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    hoursMinutes: (h: number, m: number) => string;
  };

  // HTML verification page
  html: {
    pageTitle: string;
    pageHeading: string;
    pageDescription: string;
    submitButton: string;
    submitButtonLoading: string;
    submitButtonRetry: string;
    errorNoToken: string;
    errorVerifyFailed: string;
    errorNetwork: string;
    successMessage: string;
  };

  // Method names for display
  methodNames: {
    none: string;
    math: string;
    quiz: string;
    turnstile: string;
    ai: string;
  };

  // Rate limit level names
  rateLimitLevels: [string, string, string, string];

  // Misc
  misc: {
    expiresAt: string;
    reason: string;
    notSpecified: string;
    permanentBan: string;
    temporaryBan: (hours: number) => string;
    moreItems: (count: number) => string;
    unknown: string;
    none: string;
  };
}

/**
 * Supported languages
 */
export type Language = 'en' | 'zh';
