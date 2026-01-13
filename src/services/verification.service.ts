import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { ParsedEnv } from "../env";
import { configService } from "./config.service";
import { getVerificationMethod } from "./verification";
import { getLang, getMessages, formatDuration as i18nFormatDuration, type Language } from "../i18n";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Api } from "grammy";

/**
 * Start verification flow (unified entry point)
 * Starts the appropriate verification based on configured method
 */
export async function startVerification(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  env: ParsedEnv,
  userId: string,
  lang: Language
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const m = getMessages(lang);
    
    // Get configured verification method
    const config = await configService.getVerificationConfig(db, env);

    if (!config.enabled || config.method === "none") {
      // Verification disabled, mark as verified directly
      const now = Math.floor(Date.now() / 1000);
      await db
        .update(users)
        .set({
          isVerified: true,
          verifiedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      return { success: true };
    }

    // Generate verification token (Web Crypto API)
    const token = await generateVerificationToken();
    const expiresAt = Math.floor(Date.now() / 1000) + config.timeout;

    // Update user verification token
    await db
      .update(users)
      .set({
        verificationToken: token,
        verificationExpiresAt: expiresAt,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(users.id, userId));

    // Get verification method instance
    const verifier = getVerificationMethod(config.method);

    // Generate verification challenge
    const challenge = await verifier.generateChallenge(
      db,
      api,
      env,
      userId,
      token
    );

    // Send verification message
    await verifier.sendVerificationMessage(db, api, env, userId, challenge);

    console.log("[VerificationService]", "Verification started", {
      userId,
      method: config.method,
    });

    return { success: true };
  } catch (error) {
    console.error(
      "[VerificationService]",
      "Failed to start verification",
      error
    );
    const m = getMessages(lang);
    return { success: false, error: m.verificationService.startFailed };
  }
}

/**
 * Generate verification token (Web Crypto API)
 */
export async function generateVerificationToken(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculate verification cooldown duration (exponential backoff)
 */
function calculateCooldownDuration(attempts: number): number {
  if (attempts <= 3) {
    return 0; // No cooldown for first 3 attempts
  }

  // 4th attempt onwards: 2^(attempts-3) hours
  // 4th: 2^1 = 2 hours
  // 5th: 2^2 = 4 hours
  // 6th: 2^3 = 8 hours
  // Max 24 hours
  const exponent = attempts - 3;
  const hours = Math.min(Math.pow(2, exponent), 24);

  return hours * 3600; // Convert to seconds
}

/**
 * Format duration for display
 * @deprecated Use formatDuration from i18n module instead
 */
export function formatDuration(seconds: number): string {
  // Default to English for backward compatibility
  return i18nFormatDuration('en', seconds);
}

/**
 * Check if user can request verification
 */
export async function canRequestVerification(
  db: DrizzleD1Database<typeof schema>,
  userId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  cooldownEnds?: number;
  attemptsRemaining?: number;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { allowed: true };
  }

  // If already verified, no need to verify again
  if (user.isVerified) {
    return { allowed: false, reason: "User already verified" };
  }

  const now = Math.floor(Date.now() / 1000);

  // Check cooldown time
  if (user.verificationCooldownUntil && user.verificationCooldownUntil > now) {
    return {
      allowed: false,
      reason: "Verification in cooldown",
      cooldownEnds: user.verificationCooldownUntil,
    };
  }

  // Check attempts within 1 hour
  if (user.verificationLastAttempt) {
    const hourAgo = now - 3600;

    if (user.verificationLastAttempt > hourAgo) {
      // Within 1 hour window
      if (user.verificationAttempts >= 3) {
        return {
          allowed: false,
          reason: "Verification limit reached (3/hour)",
          attemptsRemaining: 0,
        };
      }

      return {
        allowed: true,
        attemptsRemaining: 3 - user.verificationAttempts,
      };
    }
  }

  // Over 1 hour, reset count
  return { allowed: true, attemptsRemaining: 3 };
}

/**
 * Record verification attempt
 */
export async function recordVerificationAttempt(
  db: DrizzleD1Database<typeof schema>,
  userId: string
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  const now = Math.floor(Date.now() / 1000);
  const hourAgo = now - 3600;

  let newAttempts = 1;
  let cooldownUntil: number | null = null;

  // If last attempt within 1 hour, accumulate count
  if (user.verificationLastAttempt && user.verificationLastAttempt > hourAgo) {
    newAttempts = user.verificationAttempts + 1;

    // If over 3 attempts, calculate cooldown
    if (newAttempts > 3) {
      const cooldownSeconds = calculateCooldownDuration(newAttempts);
      cooldownUntil = now + cooldownSeconds;

      // Notify admin (on 4th attempt)
      if (newAttempts === 4) {
        console.warn(
          "[VerificationService]",
          "User entered verification cooldown",
          {
            userId,
            attempts: newAttempts,
            cooldownUntil,
          }
        );
      }
    }
  }

  await db
    .update(users)
    .set({
      verificationAttempts: newAttempts,
      verificationLastAttempt: now,
      verificationCooldownUntil: cooldownUntil,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

/**
 * Create verification link
 */
export async function createVerificationLink(
  db: DrizzleD1Database<typeof schema>,
  env: ParsedEnv,
  userId: string
): Promise<string> {
  const token = await generateVerificationToken();
  const expiresAt = Math.floor(Date.now() / 1000) + env.VERIFICATION_TIMEOUT;

  await db
    .update(users)
    .set({
      verificationToken: token,
      verificationExpiresAt: expiresAt,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(users.id, userId));

  return `${env.VERIFICATION_BASE_URL}/verify/${token}`;
}

/**
 * Verify Cloudflare Turnstile token
 * @deprecated Moved to verification/turnstile.ts, use that implementation
 */
export async function verifyTurnstileToken(
  env: ParsedEnv,
  token: string
): Promise<boolean> {
  // Import and call new implementation
  const { verifyTurnstileToken: newVerifyTurnstileToken } = await import(
    "./verification/turnstile"
  );
  return newVerifyTurnstileToken(env, token);
}

/**
 * Mark user as verified by token
 */
export async function markUserAsVerified(
  db: DrizzleD1Database<typeof schema>,
  token: string,
  lang: Language = 'en'
): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
  const m = getMessages(lang);
  
  const user = await db.query.users.findFirst({
    where: eq(users.verificationToken, token),
  });

  if (!user) {
    return { success: false, error: m.verificationService.invalidLink };
  }

  // Check if already verified
  if (user.isVerified) {
    return { success: true, userId: user.id };
  }

  // Check if expired
  if (user.verificationExpiresAt) {
    const now = Math.floor(Date.now() / 1000);
    if (user.verificationExpiresAt < now) {
      return { success: false, error: m.verificationService.linkExpired };
    }
  }

  // Mark as verified
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(users)
    .set({
      isVerified: true,
      verifiedAt: now,
      verificationToken: null,
      verificationExpiresAt: null,
      verificationAttempts: 0,
      verificationLastAttempt: null,
      verificationCooldownUntil: null,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  console.log("[VerificationService]", "User verified successfully", {
    userId: user.id,
  });

  return { success: true, userId: user.id };
}

/**
 * Get user verification status
 */
export async function getVerificationStatus(
  db: DrizzleD1Database<typeof schema>,
  userId: string
): Promise<{
  isVerified: boolean;
  hasActiveLink: boolean;
  linkExpired: boolean;
  attemptsRemaining?: number;
  cooldownEnds?: number;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return {
      isVerified: false,
      hasActiveLink: false,
      linkExpired: false,
    };
  }

  if (user.isVerified) {
    return {
      isVerified: true,
      hasActiveLink: false,
      linkExpired: false,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  let hasActiveLink = false;
  let linkExpired = false;

  if (user.verificationToken && user.verificationExpiresAt) {
    if (user.verificationExpiresAt > now) {
      hasActiveLink = true;
    } else {
      linkExpired = true;
    }
  }

  // Check remaining attempts
  const canVerify = await canRequestVerification(db, userId);

  return {
    isVerified: false,
    hasActiveLink,
    linkExpired,
    attemptsRemaining: canVerify.attemptsRemaining,
    cooldownEnds: canVerify.cooldownEnds,
  };
}
