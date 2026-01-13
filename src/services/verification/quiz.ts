import { BaseVerificationMethod } from "./base";
import type { VerificationChallenge } from "../../types/verification";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { Api } from "grammy";
import type { ParsedEnv } from "../../env";
import { getLang, getMessages, type Language } from "../../i18n";

export class QuizVerification extends BaseVerificationMethod {
  /**
   * Generate quiz challenge
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
    
    // Get quiz bank from language pack
    const quizBank = m.verification.quizBank;
    
    // Randomly select a question
    const quiz = quizBank[Math.floor(Math.random() * quizBank.length)];

    // Save verification data to database
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(users)
      .set({
        verificationData: JSON.stringify({
          method: "quiz",
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
        console.warn('[QuizVerification]', 'No verification data found', { userId });
        return false;
      }

      const data = typeof user.verificationData === 'string'
        ? JSON.parse(user.verificationData)
        : user.verificationData;

      if (data.method !== "quiz") {
        console.warn('[QuizVerification]', 'Wrong verification method', {
          userId,
          method: data.method,
        });
        return false;
      }

      // Compare answer (answer is index in string form)
      const isCorrect = data.correctAnswer?.toString() === answer;

      console.log('[QuizVerification]', 'Quiz verification attempt', {
        userId,
        answer,
        correctAnswer: data.correctAnswer,
        isCorrect,
      });

      return isCorrect;
    } catch (error) {
      console.error('[QuizVerification]', 'Failed to verify quiz answer', error);
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
      // Short format: vq_{userId}_{index}
      const keyboard = challenge.options.map((option, index) => [
        {
          text: option,
          callback_data: `vq_${userId}_${index}`,
        },
      ]);

      const sentMessage = await api.sendMessage(
        userId,
        m.verification.quizQuestion(challenge.question),
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

      console.log('[QuizVerification]', 'Quiz verification message sent', {
        userId,
        messageId: sentMessage.message_id,
      });
    } catch (error) {
      console.error('[QuizVerification]', 'Failed to send quiz verification message', error);
      throw error;
    }
  }
}
