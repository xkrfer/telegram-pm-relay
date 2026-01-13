import { BaseVerificationMethod } from "./base";
import type { VerificationChallenge } from "../../types/verification";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { Api } from "grammy";
import type { ParsedEnv } from "../../env";
import { getLang, getMessages } from "../../i18n";

/**
 * AI Verification - Note: Cloudflare Workers Free Plan does not support AI SDK
 * This implementation is for reference only. For actual deployment:
 * 1. Use Paid Workers plan
 * 2. Or use external AI API (like OpenAI) but be aware of latency and cost
 * 3. Or disable AI verification method
 */
export class AIVerification extends BaseVerificationMethod {
  /**
   * Generate AI verification challenge
   * 
   * Warning: This method may not work in Workers environment
   * Recommend using Math or Quiz verification instead
   */
  async generateChallenge(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    token: string
  ): Promise<VerificationChallenge> {
    try {
      // Call external AI API to generate question
      const quiz = await this.generateAIQuiz(env);

      // Save verification data to database
      const now = Math.floor(Date.now() / 1000);
      await db
        .update(users)
        .set({
          verificationData: JSON.stringify({
            method: "ai",
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correct,
          }),
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      const expiresAt = now + 15 * 60; // 15 minutes expiry

      return {
        token,
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correct,
        expiresAt,
      };
    } catch (error) {
      console.error('[AIVerification]', 'Failed to generate AI challenge', error);
      // Throw error on AI failure, let caller handle fallback
      throw error;
    }
  }

  /**
   * Call AI API to generate question
   */
  private async generateAIQuiz(env: ParsedEnv): Promise<{
    question: string;
    options: string[];
    correct: number;
  }> {
    if (!env.AI_VERIFICATION_API_KEY) {
      throw new Error('AI_VERIFICATION_API_KEY not configured');
    }

    const lang = getLang(env);
    const m = getMessages(lang);

    try {
      const response = await fetch(`${env.AI_VERIFICATION_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_VERIFICATION_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.AI_VERIFICATION_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates simple quiz questions for human verification.',
            },
            {
              role: 'user',
              content: m.verification.aiPrompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Invalid AI API response');
      }

      // Parse JSON response
      const quiz = JSON.parse(content);

      if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length !== 4 || typeof quiz.correct !== 'number') {
        throw new Error('Invalid quiz format from AI');
      }

      console.log('[AIVerification]', 'AI quiz generated successfully', { question: quiz.question });

      return quiz;
    } catch (error) {
      console.error('[AIVerification]', 'Failed to generate AI quiz', error);
      throw error;
    }
  }

  /**
   * Verify user answer
   */
  async verifyAnswer(
    db: DrizzleD1Database<typeof schema>,
    userId: string,
    token: string,
    answer: string
  ): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.verificationData) {
        console.warn('[AIVerification]', 'No verification data found', { userId });
        return false;
      }

      const data = typeof user.verificationData === 'string'
        ? JSON.parse(user.verificationData)
        : user.verificationData;

      if (data.method !== "ai") {
        console.warn('[AIVerification]', 'Wrong verification method', {
          userId,
          method: data.method,
        });
        return false;
      }

      // Compare answer (answer is index in string form)
      const isCorrect = data.correctAnswer?.toString() === answer;

      console.log('[AIVerification]', 'AI verification attempt', {
        userId,
        answer,
        correctAnswer: data.correctAnswer,
        isCorrect,
      });

      return isCorrect;
    } catch (error) {
      console.error('[AIVerification]', 'Failed to verify AI answer', error);
      return false;
    }
  }

  /**
   * Send verification message (with Inline Keyboard)
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
      
      // Build Inline Keyboard (one option per row)
      // Short format: va_{userId}_{index}
      const keyboard = challenge.options.map((option, index) => [
        {
          text: option,
          callback_data: `va_${userId}_${index}`,
        },
      ]);

      const sentMessage = await api.sendMessage(
        userId,
        m.verification.aiQuestion(challenge.question),
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );

      // Save message ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (user && user.verificationData) {
        const data = typeof user.verificationData === 'string'
          ? JSON.parse(user.verificationData)
          : user.verificationData;

        await db
          .update(users)
          .set({
            verificationData: JSON.stringify({
              ...data,
              messageId: sentMessage.message_id,
            }),
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(users.id, userId));
      }

      console.log('[AIVerification]', 'AI verification message sent', {
        userId,
        messageId: sentMessage.message_id,
      });
    } catch (error) {
      console.error('[AIVerification]', 'Failed to send AI verification message', error);
      throw error;
    }
  }
}
