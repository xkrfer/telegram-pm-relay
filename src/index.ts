import { Hono } from "hono";
import { createBot } from "./lib/telegram";
import { createDb } from "./db";
import { parseEnv, type Env } from "./env";
import { handleAdminMessage } from "./handlers/admin";
import { handleGuestMessage } from "./handlers/guest";
import { handleCallbackQuery } from "./handlers/callback";
import { handleEditedMessage } from "./handlers/edit";
import { configService } from "./services/config.service";
import { markUserAsVerified } from "./services/verification.service";
import { verifyTurnstileToken } from "./services/verification/turnstile";
import { fraudList, users } from "./db/schema";
import { and, isNotNull, lt, eq } from "drizzle-orm";
import { getVerifyInlineHtml } from "./views/verify-inline";
import { getLang, getMessages } from "./i18n";

// Create Hono app with Env type binding
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: c.env.NODE_ENV || "production",
  })
);

// Webhook route - using Grammy webhook adapter
app.post("/webhook", async (c) => {
  try {
    const rawEnv = c.env;
    const env = parseEnv(rawEnv);
    const db = createDb(rawEnv.DB);
    const bot = createBot(rawEnv.BOT_TOKEN);

    // Verify webhook secret
    const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== rawEnv.BOT_SECRET) {
      return c.text("Unauthorized", 403);
    }

    const update = await c.req.json();

    // Handle callback_query (button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(db, bot.api, update.callback_query, env);
      return c.text("ok");
    }

    // Handle edited messages
    if (update.edited_message) {
      await handleEditedMessage(db, bot.api, env, update.edited_message);
      return c.text("ok");
    }

    // Handle regular messages
    const msg = update.message;

    if (!msg) {
      return c.text("ok"); // Ignore non-message updates
    }

    const chatId = msg.chat.id.toString();

    // Route dispatch
    if (chatId === env.ADMIN_UID.toString()) {
      await handleAdminMessage(db, bot.api, env, msg, chatId);
    } else {
      await handleGuestMessage(db, bot.api, env, msg, chatId);
    }
  } catch (error) {
    console.error("[Webhook]", "Webhook processing error", error);
  }

  return c.text("ok");
});

// Verification page route
app.get("/verify/:token", async (c) => {
  const rawEnv = c.env;
  const db = createDb(rawEnv.DB);
  const token = c.req.param("token");
  const lang = getLang(rawEnv);
  const m = getMessages(lang);

  try {
    // Verify token is valid
    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });

    if (!user) {
      return c.html(m.verification.linkInvalid);
    }

    // Check if already verified
    if (user.isVerified) {
      return c.html(m.verification.linkAlreadyVerified);
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (user.verificationExpiresAt && user.verificationExpiresAt < now) {
      return c.html(m.verification.linkExpired);
    }

    // Show verification page
    const htmlContent = getVerifyInlineHtml(
      lang,
      rawEnv.CLOUDFLARE_TURNSTILE_SITE_KEY || ""
    );

    return c.html(htmlContent);
  } catch (error) {
    console.error("[Verify]", "Failed to serve verification page", error);
    return c.html(m.verification.linkPageFailed);
  }
});

// Verification submit route
app.post("/verify/:token", async (c) => {
  const rawEnv = c.env;
  const env = parseEnv(rawEnv);
  const db = createDb(rawEnv.DB);
  const bot = createBot(rawEnv.BOT_TOKEN);
  const token = c.req.param("token");
  const lang = getLang(rawEnv);
  const m = getMessages(lang);

  try {
    const body = await c.req.json();
    const turnstileToken = body.token;

    if (!turnstileToken) {
      return c.json({ success: false, error: m.verification.linkMissingToken });
    }

    // Verify Cloudflare Turnstile
    const isTurnstileValid = await verifyTurnstileToken(env, turnstileToken);

    if (!isTurnstileValid) {
      console.warn("[Verify]", "Turnstile verification failed", { token });
      return c.json({ success: false, error: m.verification.linkVerifyFailed });
    }

    // Mark user as verified
    const result = await markUserAsVerified(db, token, lang);

    if (!result.success) {
      return c.json({ success: false, error: result.error });
    }

    console.log("[Verify]", "User verified via Turnstile", {
      userId: result.userId,
    });

    // Send Telegram notification
    if (result.userId) {
      try {
        await bot.api.sendMessage(
          result.userId,
          m.verification.successNotification
        );
        console.log("[Verify]", "Verification success message sent", {
          userId: result.userId,
        });
      } catch (error) {
        console.warn(
          "[Verify]",
          "Failed to send verification success message",
          error
        );
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("[Verify]", "Verification processing error", error);
    return c.json({ success: false, error: m.verification.linkServerError });
  }
});

// Workers export
export default {
  /**
   * Fetch handler - handles HTTP requests
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  /**
   * Scheduled handler - handles Cron triggers
   * Configured in wrangler.jsonc triggers.crons
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log("[Cron]", "Running scheduled task", { cron: event.cron });

    try {
      const db = createDb(env.DB);
      const now = Math.floor(Date.now() / 1000);

      // Clean up expired banlist entries
      const deleted = await db
        .delete(fraudList)
        .where(
          and(isNotNull(fraudList.expiresAt), lt(fraudList.expiresAt, now))
        )
        .returning();

      if (deleted.length > 0) {
        console.log("[Cron]", "Cleaned expired fraud list entries", {
          count: deleted.length,
        });
      }

      // Initialize default config (if needed)
      const parsedEnv = parseEnv(env);
      await configService.initializeDefaultConfig(db, parsedEnv);
    } catch (error) {
      console.error("[Cron]", "Failed to run scheduled task", error);
    }
  },
};
