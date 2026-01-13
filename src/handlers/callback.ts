import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Api } from "grammy";
import { getVerificationMethod } from "../services/verification";
import { markUserAsVerified } from "../services/verification.service";
import { getLang, getMessages } from "../i18n";
import type { ParsedEnv } from "../env";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";

/**
 * Handle Telegram Callback Query
 */
export async function handleCallbackQuery(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  query: any,
  env: ParsedEnv
) {
  const chatId = query.from.id.toString();
  const data = query.data;
  const messageId = query.message.message_id;
  const lang = getLang(env);
  const m = getMessages(lang);

  console.log('[CallbackQuery]', 'Received callback query', { chatId, data });

  try {
    // Answer callback query immediately (avoid timeout)
    await api.answerCallbackQuery(query.id);

    // Parse callback_data
    // Format: vm_{userId}_{answer} (math)
    //         vq_{userId}_{index} (quiz)
    //         va_{userId}_{index} (ai)
    const parts = data.split("_");

    // Map short prefix to full method name
    const methodMap: Record<string, "math" | "quiz" | "ai"> = {
      vm: "math",
      vq: "quiz",
      va: "ai",
    };

    const methodPrefix = parts[0];
    const method = methodMap[methodPrefix];

    if (!method) {
      console.warn('[CallbackQuery]', 'Unknown callback action', { data });
      return;
    }

    const userIdFromCallback = parts[1];
    const answer = parts[2];

    // Verify user ID matches
    if (userIdFromCallback !== chatId) {
      console.warn('[CallbackQuery]', 'User ID mismatch in callback', {
        data,
        chatId,
        userIdFromCallback,
      });
      await api.answerCallbackQuery(query.id, {
        text: m.verification.errorMismatch,
        show_alert: true,
      });
      return;
    }

    // Handle verification
    await handleVerificationCallback(db, api, chatId, messageId, method, answer, lang);
  } catch (error) {
    console.error('[CallbackQuery]', 'Failed to handle callback query', error);
  }
}

/**
 * Handle verification-related callbacks
 */
async function handleVerificationCallback(
  db: DrizzleD1Database<typeof schema>,
  api: Api,
  userId: string,
  messageId: number,
  method: "math" | "quiz" | "ai",
  answer: string,
  lang: "en" | "zh"
) {
  const m = getMessages(lang);

  try {
    // Query user verification data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      await api.editMessageText(userId, messageId, m.admin.userNotFound);
      return;
    }

    // Check if verification token exists (session exists)
    if (!user.verificationToken) {
      await api.editMessageText(userId, messageId, m.verification.errorNoSession);
      return;
    }

    // Check if already verified
    if (user.isVerified) {
      await api.editMessageText(userId, messageId, m.verification.errorAlreadyVerified);
      return;
    }

    // Check if verification expired
    const now = Math.floor(Date.now() / 1000);
    if (user.verificationExpiresAt && user.verificationExpiresAt < now) {
      await api.editMessageText(userId, messageId, m.verification.errorExpired);
      return;
    }

    // Get verification method instance and verify answer
    const verifier = getVerificationMethod(method);
    const isCorrect = await verifier.verifyAnswer(
      db,
      userId,
      user.verificationToken,
      answer
    );

    if (isCorrect) {
      // Verification successful
      await markUserAsVerified(db, user.verificationToken, lang);

      // Show success message based on method
      const successMessages = {
        math: m.verification.successMath,
        quiz: m.verification.successQuiz,
        ai: m.verification.successAI,
      };

      await api.editMessageText(userId, messageId, successMessages[method]);

      console.log('[CallbackQuery]', 'User verified successfully', { userId, method });

      // Send welcome message
      try {
        await api.sendMessage(userId, m.verification.successWelcome);
      } catch (error) {
        console.warn('[CallbackQuery]', 'Failed to send welcome message', error);
      }
    } else {
      // Verification failed
      const verificationDataStr = user.verificationData;
      const verificationData = verificationDataStr
        ? (typeof verificationDataStr === 'string' ? JSON.parse(verificationDataStr) : verificationDataStr)
        : null;

      // Show failure message header based on method
      const failureHeaders = {
        math: m.verification.errorMathWrong,
        quiz: m.verification.errorQuizWrong,
        ai: m.verification.errorAIWrong,
      };

      let errorMessage = failureHeaders[method];

      // Show correct answer hint
      if (method === "math" || method === "quiz" || method === "ai") {
        if (
          verificationData?.options &&
          verificationData?.correctAnswer !== undefined
        ) {
          const correctIndex =
            typeof verificationData.correctAnswer === "number"
              ? verificationData.correctAnswer
              : parseInt(verificationData.correctAnswer.toString());

          const correctOption = verificationData.options[correctIndex];
          errorMessage += m.verification.errorCorrectAnswer(correctOption);
        }
      }

      errorMessage += m.verification.errorRetry;

      await api.editMessageText(userId, messageId, errorMessage);

      console.log('[CallbackQuery]', 'Verification attempt failed', { userId, method, answer });
    }
  } catch (error) {
    console.error('[CallbackQuery]', 'Failed to handle verification callback', error);

    try {
      await api.editMessageText(userId, messageId, m.verification.errorProcessing);
    } catch (editError) {
      console.error('[CallbackQuery]', 'Failed to edit error message', editError);
    }
  }
}
