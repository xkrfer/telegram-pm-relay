import { Hono } from "hono";
import { createBot } from "./lib/telegram";
import { createDb } from "./db";
import { parseEnv, type Env } from "./env";
import { handleAdminMessage } from "./handlers/admin";
import { handleGuestMessage } from "./handlers/guest";
import { handleCallbackQuery } from "./handlers/callback";
import { handleEditedMessage } from "./handlers/edit";
import { configService } from "./services/config.service";
import { fraudList } from "./db/schema";
import { and, isNotNull, lt } from "drizzle-orm";

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
