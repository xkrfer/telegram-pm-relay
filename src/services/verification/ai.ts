import { generateText, Output } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
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
 * Quiz schema for structured AI output
 */
const quizSchema = z.object({
  question: z.string().describe("A simple common-sense question"),
  options: z.array(z.string()).length(4).describe("4 answer options"),
  correct: z.number().min(0).max(3).describe("Index of correct answer (0-3)"),
});

type Quiz = z.infer<typeof quizSchema>;

/**
 * AI Verification using Vercel AI SDK
 * Generates structured quiz data with type-safe output
 */
export class AIVerification extends BaseVerificationMethod {
  /**
   * Generate AI verification challenge
   */
  async generateChallenge(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    token: string
  ): Promise<VerificationChallenge> {
    try {
      // Call AI SDK to generate structured quiz
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
      console.error(
        "[AIVerification]",
        "Failed to generate AI challenge",
        error
      );
      // Throw error on AI failure, let caller handle fallback
      throw error;
    }
  }

  /**
   * Generate structured quiz using AI SDK
   */
  private async generateAIQuiz(env: ParsedEnv): Promise<Quiz> {
    if (!env.AI_VERIFICATION_API_KEY) {
      throw new Error("AI_VERIFICATION_API_KEY not configured");
    }

    const lang = getLang(env);
    const m = getMessages(lang);

    // Create OpenAI-compatible provider
    const provider = createOpenAICompatible({
      name: "ai-verification",
      baseURL: env.AI_VERIFICATION_BASE_URL,
      apiKey: env.AI_VERIFICATION_API_KEY,
    });

    try {
      // Generate random seed to ensure different questions each time
      const randomSeed = Math.floor(Math.random() * 10000) + 1;

      const { output: quiz } = await generateText({
        model: provider.chatModel(env.AI_VERIFICATION_MODEL),
        output: Output.object({ schema: quizSchema }),
        system:
          "You are a helpful assistant that generates simple quiz questions for human verification. Always generate a unique and creative question.",
        prompt: `${m.verification.aiPrompt}\n\n[Seed: ${randomSeed}] Please generate a unique question that is different from typical examples.`,
        temperature: 0.8,
      });

      console.log("[AIVerification]", "AI quiz generated successfully", {
        question: quiz.question,
      });

      return quiz;
    } catch (error) {
      console.error("[AIVerification]", "Failed to generate AI quiz", error);
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
        console.warn("[AIVerification]", "No verification data found", {
          userId,
        });
        return false;
      }

      const data =
        typeof user.verificationData === "string"
          ? JSON.parse(user.verificationData)
          : user.verificationData;

      if (data.method !== "ai") {
        console.warn("[AIVerification]", "Wrong verification method", {
          userId,
          method: data.method,
        });
        return false;
      }

      // Compare answer (answer is index in string form)
      const isCorrect = data.correctAnswer?.toString() === answer;

      console.log("[AIVerification]", "AI verification attempt", {
        userId,
        answer,
        correctAnswer: data.correctAnswer,
        isCorrect,
      });

      return isCorrect;
    } catch (error) {
      console.error("[AIVerification]", "Failed to verify AI answer", error);
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
        const data =
          typeof user.verificationData === "string"
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

      console.log("[AIVerification]", "AI verification message sent", {
        userId,
        messageId: sentMessage.message_id,
      });
    } catch (error) {
      console.error(
        "[AIVerification]",
        "Failed to send AI verification message",
        error
      );
      throw error;
    }
  }
}
