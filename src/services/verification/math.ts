import { BaseVerificationMethod } from "./base";
import type { VerificationChallenge } from "../../types/verification";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { Api } from "grammy";
import type { ParsedEnv } from "../../env";
import { getLang, getMessages } from "../../i18n";

export class MathVerification extends BaseVerificationMethod {
  /**
   * Generate arithmetic challenge
   */
  async generateChallenge(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    token: string
  ): Promise<VerificationChallenge> {
    // Generate random arithmetic problem
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operation = Math.random() > 0.5 ? "+" : "-";

    let correctAnswer: number;
    let question: string;

    if (operation === "+") {
      correctAnswer = num1 + num2;
      question = `${num1} + ${num2} = ?`;
    } else {
      // Ensure subtraction result is positive
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      correctAnswer = larger - smaller;
      question = `${larger} - ${smaller} = ?`;
    }

    // Generate distractors (wrong answers)
    const wrongAnswers = [
      correctAnswer + 1,
      correctAnswer - 1,
      correctAnswer + 2,
    ];

    // Mix correct and wrong answers, then shuffle
    const allAnswers = [correctAnswer, ...wrongAnswers];
    const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

    // Save verification data to database
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(users)
      .set({
        verificationData: JSON.stringify({
          method: "math",
          question,
          options: shuffledAnswers.map((a) => a.toString()),
          correctAnswer: correctAnswer.toString(),
        }),
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    const expiresAt = now + 15 * 60; // 15 minutes expiry

    return {
      token,
      question,
      options: shuffledAnswers.map((a) => a.toString()),
      correctAnswer: correctAnswer.toString(),
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
        console.warn('[MathVerification]', 'No verification data found', { userId });
        return false;
      }

      const data = typeof user.verificationData === 'string'
        ? JSON.parse(user.verificationData)
        : user.verificationData;

      if (data.method !== "math") {
        console.warn('[MathVerification]', 'Wrong verification method', { userId, method: data.method });
        return false;
      }

      // Compare answer
      const isCorrect = data.correctAnswer === answer;

      console.log('[MathVerification]', 'Math verification attempt', {
        userId,
        answer,
        correctAnswer: data.correctAnswer,
        isCorrect,
      });

      return isCorrect;
    } catch (error) {
      console.error('[MathVerification]', 'Failed to verify math answer', error);
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
      const options = challenge.options;

      // Build Inline Keyboard (2x2 layout)
      // Short format: vm_{userId}_{answer}
      const keyboard = [
        [
          {
            text: options[0],
            callback_data: `vm_${userId}_${options[0]}`,
          },
          {
            text: options[1],
            callback_data: `vm_${userId}_${options[1]}`,
          },
        ],
        [
          {
            text: options[2],
            callback_data: `vm_${userId}_${options[2]}`,
          },
          {
            text: options[3],
            callback_data: `vm_${userId}_${options[3]}`,
          },
        ],
      ];

      const sentMessage = await api.sendMessage(
        userId,
        m.verification.mathQuestion(challenge.question),
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );

      // Save message ID for later editing
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

      console.log('[MathVerification]', 'Math verification message sent', {
        userId,
        messageId: sentMessage.message_id,
      });
    } catch (error) {
      console.error('[MathVerification]', 'Failed to send math verification message', error);
      throw error;
    }
  }
}
