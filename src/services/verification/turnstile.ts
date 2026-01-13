import { BaseVerificationMethod } from "./base";
import type { VerificationChallenge } from "../../types/verification";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { Api } from "grammy";
import type { ParsedEnv } from "../../env";
import { getLang, getMessages } from "../../i18n";

export class TurnstileVerification extends BaseVerificationMethod {
  /**
   * Generate Turnstile verification challenge
   */
  async generateChallenge(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    token: string
  ): Promise<VerificationChallenge> {
    const lang = getLang(env);
    const m = getMessages(lang);
    
    // Turnstile uses Web page verification, return basic info here
    const expiresAt = Math.floor(Date.now() / 1000) + env.VERIFICATION_TIMEOUT;

    // Save verification data
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(users)
      .set({
        verificationToken: token,
        verificationExpiresAt: expiresAt,
        verificationData: JSON.stringify({
          method: "turnstile",
        }),
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return {
      token,
      question: m.verification.turnstileChallenge,
      options: [],
      correctAnswer: token,
      expiresAt,
    };
  }

  /**
   * Verify Turnstile token (called by Web page)
   */
  async verifyAnswer(
    db: DrizzleD1Database<typeof schema>,
    userId: string,
    token: string,
    answer: string
  ): Promise<boolean> {
    // Turnstile verification is handled by verifyTurnstileToken function in Web page
    // This method is not directly called in Telegram inline flow
    return true;
  }

  /**
   * Send verification message (with redirect button)
   */
  async sendVerificationMessage(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    challenge: VerificationChallenge
  ): Promise<void> {
    try {
      const lang = getLang(env);
      const m = getMessages(lang);
      const verifyLink = `${env.VERIFICATION_BASE_URL}/verify/${challenge.token}`;

      const keyboard = [
        [
          {
            text: m.verification.turnstileButton,
            url: verifyLink,
          },
        ],
      ];

      const sentMessage = await api.sendMessage(
        userId,
        m.verification.turnstileMessage(Math.floor(env.VERIFICATION_TIMEOUT / 60)),
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );

      console.log('[TurnstileVerification]', 'Turnstile verification message sent', {
        userId,
        messageId: sentMessage.message_id,
      });
    } catch (error) {
      console.error('[TurnstileVerification]', 'Failed to send turnstile verification message', error);
      throw error;
    }
  }
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstileToken(
  env: ParsedEnv,
  token: string
): Promise<boolean> {
  if (!env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    console.warn('[TurnstileVerification]', 'CLOUDFLARE_TURNSTILE_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data: any = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[TurnstileVerification]', 'Failed to verify Turnstile token', error);
    return false;
  }
}
