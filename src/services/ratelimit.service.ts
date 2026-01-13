import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema";
import type { ParsedEnv } from "../env";
import { getMessages, type Language } from "../i18n";

// Rate limit config type
interface RateLimitConfig {
  perMinute: number;
  perHour: number;
  cooldown: number; // seconds
}

// Rate limit check result
interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  waitTime?: number; // seconds to wait
}

// Warning message result
interface WarningResult {
  message: string;
  isFirstViolation: boolean;
  penaltyDuration: number; // seconds
}

/**
 * Get rate limit config by level
 */
export function getRateLimitConfig(
  level: number,
  env: ParsedEnv
): RateLimitConfig {
  const configs: Record<number, RateLimitConfig> = {
    0: {
      // Normal
      perMinute: env.RATE_LIMIT_PER_MINUTE,
      perHour: env.RATE_LIMIT_PER_HOUR,
      cooldown: env.RATE_LIMIT_COOLDOWN,
    },
    1: {
      // Relaxed (VIP)
      perMinute: env.RATE_LIMIT_PER_MINUTE * 2,
      perHour: env.RATE_LIMIT_PER_HOUR * 2,
      cooldown: Math.max(1, Math.floor(env.RATE_LIMIT_COOLDOWN / 2)),
    },
    2: {
      // Strict
      perMinute: Math.max(3, Math.floor(env.RATE_LIMIT_PER_MINUTE / 2)),
      perHour: Math.max(10, Math.floor(env.RATE_LIMIT_PER_HOUR / 2)),
      cooldown: env.RATE_LIMIT_COOLDOWN * 2,
    },
    3: {
      // Very Strict
      perMinute: 1,
      perHour: 10,
      cooldown: 60,
    },
  };

  return configs[level] || configs[0];
}

/**
 * Check if user can send message
 */
export async function checkRateLimit(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  user: any,
  env: ParsedEnv,
  lang: Language = 'en'
): Promise<RateLimitResult> {
  const now = Date.now();
  const m = getMessages(lang);

  // Check if in penalty period
  if (user.rateLimitedUntil) {
    const limitedUntil = user.rateLimitedUntil * 1000; // Convert to milliseconds
    if (now < limitedUntil) {
      const waitSeconds = Math.ceil((limitedUntil - now) / 1000);
      return {
        allowed: false,
        reason: m.rateLimit.inPenalty(waitSeconds),
        waitTime: waitSeconds,
      };
    }
  }

  const config = getRateLimitConfig(user.rateLimitLevel || 0, env);

  // Parse JSON field
  const lastMessageTimes: number[] = JSON.parse(user.lastMessageTimes || "[]");

  // Check cooldown time
  if (lastMessageTimes.length > 0) {
    const lastMessageTime = Math.max(...lastMessageTimes);
    const timeSinceLastMessage = (now - lastMessageTime) / 1000; // Convert to seconds

    if (timeSinceLastMessage < config.cooldown) {
      const waitSeconds = Math.ceil(config.cooldown - timeSinceLastMessage);
      return {
        allowed: false,
        reason: m.rateLimit.cooldownNotReached(waitSeconds),
        waitTime: waitSeconds,
      };
    }
  }

  // Check per-minute limit
  const oneMinuteAgo = now - 60 * 1000;
  const messagesLastMinute = lastMessageTimes.filter(
    (t) => t > oneMinuteAgo
  ).length;

  if (messagesLastMinute >= config.perMinute) {
    return {
      allowed: false,
      reason: m.rateLimit.perMinuteExceeded(config.perMinute),
      waitTime: 60,
    };
  }

  // Check per-hour limit
  const oneHourAgo = now - 60 * 60 * 1000;
  const messagesLastHour = lastMessageTimes.filter(
    (t) => t > oneHourAgo
  ).length;

  if (messagesLastHour >= config.perHour) {
    return {
      allowed: false,
      reason: m.rateLimit.perHourExceeded(config.perHour),
      waitTime: 3600,
    };
  }

  return { allowed: true };
}

/**
 * Record message timestamp
 */
export async function recordMessageTime(
  db: DrizzleD1Database<typeof schema>,
  userId: string
): Promise<void> {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Get current user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  // Parse JSON field
  const lastMessageTimes: number[] = JSON.parse(user.lastMessageTimes || "[]");

  // Clean timestamps older than 1 hour
  const recentTimes = lastMessageTimes.filter((t) => t > oneHourAgo);

  // Add current time
  recentTimes.push(now);

  // Update database (serialize to JSON)
  await db
    .update(users)
    .set({
      lastMessageTimes: JSON.stringify(recentTimes),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(users.id, userId));
}

/**
 * Handle rate limit violation
 */
export async function handleRateLimitViolation(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  user: any,
  waitTime: number,
  env: ParsedEnv,
  lang: Language = 'en'
): Promise<WarningResult> {
  const violations = (user.rateLimitViolations || 0) + 1;
  const m = getMessages(lang);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  // Set penalty duration based on violation count
  let penaltyDuration: number;
  let message: string;

  if (violations === 1) {
    // First violation: 30 seconds
    penaltyDuration = 30;
    message = m.rateLimit.firstWarning(env.RATE_LIMIT_COOLDOWN, env.RATE_LIMIT_PER_MINUTE);
  } else if (violations === 2) {
    // Second violation: 5 minutes
    penaltyDuration = 300;
    const unlockTime = new Date(Date.now() + 300 * 1000).toLocaleString(locale);
    message = m.rateLimit.secondWarning(unlockTime);
  } else {
    // Third and beyond: 30 minutes
    penaltyDuration = 1800;
    const unlockTime = new Date(Date.now() + 1800 * 1000).toLocaleString(locale);
    message = m.rateLimit.thirdWarning(unlockTime);
  }

  // Update database
  const rateLimitedUntil = Math.floor(
    (Date.now() + penaltyDuration * 1000) / 1000
  );

  await db
    .update(users)
    .set({
      rateLimitViolations: violations,
      rateLimitedUntil,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(users.id, userId));

  return {
    message,
    isFirstViolation: violations === 1,
    penaltyDuration,
  };
}

/**
 * Set user rate limit level
 */
export async function setRateLimitLevel(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  level: number
): Promise<void> {
  await db
    .update(users)
    .set({
      rateLimitLevel: level,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(users.id, userId));
}

/**
 * Reset user rate limit status
 */
export async function resetRateLimit(
  db: DrizzleD1Database<typeof schema>,
  userId: string
): Promise<void> {
  await db
    .update(users)
    .set({
      rateLimitViolations: 0,
      rateLimitedUntil: null,
      lastMessageTimes: "[]",
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(users.id, userId));
}
