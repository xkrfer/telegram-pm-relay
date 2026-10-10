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
  question: z.string().trim().min(1).describe("A simple common-sense question"),
  options: z.array(z.string().trim().min(1)).length(4).describe("4 answer options"),
  correct: z.number().int().min(0).max(3).describe("Index of correct answer (0-3)"),
});

type Quiz = z.infer<typeof quizSchema>;

/**
 * AI Verification using Cloudflare Workers AI
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
      // Call Workers AI to generate structured quiz
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
   * Generate structured quiz using Workers AI
   */
  private async generateAIQuiz(env: ParsedEnv): Promise<Quiz> {
    if (!env.AI) {
      throw new Error("Workers AI binding not configured");
    }

    const lang = getLang(env);
    const m = getMessages(lang);

    try {
      // Vary the actual subject and reasoning task, not just an opaque seed.
      // This reduces repetition without storing question history.
      const topics = [
        "kitchen utensils", "food storage", "clothing and weather",
        "household cleaning", "bathroom objects", "school supplies",
        "public transport", "pedestrian safety", "shopping and packaging",
        "gardening", "pet care", "sports equipment", "everyday tools",
        "furniture", "personal hygiene", "recycling", "lighting",
        "rainy-day activities", "travel supplies", "simple cooking",
        "musical instruments", "measuring everyday objects", "sleep and rest",
        "common materials", "playground activities", "laundry",
        "communication devices", "organizing belongings", "drinking water",
        "opening and closing containers", "plant care", "library activities",
      ];
      const angles = [
        "choose the object suitable for a specific task",
        "identify an object's everyday purpose",
        "choose the sensible next step in a short situation",
        "identify a directly observable property",
        "predict a simple everyday cause and effect",
        "choose the appropriate place to keep or use an object",
        "match an object to a common activity",
        "identify which item belongs to an everyday category",
      ];
      const random = crypto.getRandomValues(new Uint32Array(3));
      const diversityPrompt = [
        `Topic: ${topics[random[0] % topics.length]}.`,
        `Question angle: ${angles[random[1] % angles.length]}.`,
        `Place the correct option at zero-based index ${random[2] % 4}.`,
        `Generation time (UTC): ${new Date().toISOString()}.`,
        `Variation ID: ${crypto.randomUUID()}.`,
        "Invent a concrete, short everyday situation within the topic. Vary the object, action, wording and distractors.",
        "Use the time and variation ID only as variation cues; never mention them or ask the user about them.",
        "Avoid stock questions about sky color, sunrise direction, number of seasons or days in a week, falling objects, or which animal flies.",
        "Keep one unambiguous answer. Avoid subjective preferences, regional customs, specialist knowledge and current events.",
        `Write the question and all options in ${lang === "zh" ? "Simplified Chinese" : "English"}.`,
      ].join("\n");

      const result = await env.AI.run(env.AI_VERIFICATION_MODEL, {
        messages: [
          { role: "system", content: "Generate a simple human verification quiz. Return only JSON with question, options (exactly four distinct strings), and correct (integer index 0-3)." },
          { role: "user", content: `${m.verification.aiPrompt}\n\n${diversityPrompt}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "verification_quiz", strict: true, schema: z.toJSONSchema(quizSchema) },
        },
        stream: false,
        reasoning_effort: "low",
        max_completion_tokens: 2048,
        temperature: 0.8,
      });
      const choice = result.choices?.[0];
      if (choice?.finish_reason !== "stop") {
        throw new Error(`Workers AI did not complete the quiz (finish_reason=${choice?.finish_reason ?? "missing"})`);
      }
      if (choice.message?.refusal || !choice.message?.content) {
        throw new Error("Workers AI returned no quiz content or refused the request");
      }
      const quiz = quizSchema.parse(JSON.parse(choice.message.content));
      if (new Set(quiz.options).size !== 4) {
        throw new Error("Workers AI returned duplicate options");
      }

      console.log("[AIVerification]", "AI quiz generated successfully", {
        question: quiz.question,
      });

      return quiz;
    } catch (error) {
      console.error("[AIVerification]", "Failed to generate AI quiz", {
        model: env.AI_VERIFICATION_MODEL,
        error: error instanceof Error ? error.message : String(error),
      });
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
