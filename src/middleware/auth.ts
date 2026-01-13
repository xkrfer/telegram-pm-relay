import { Context, Next } from "hono";
import type { Env } from "@/env";

export async function webhookAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");

  if (secret !== c.env.BOT_SECRET) {
    return c.text("Unauthorized", 403);
  }

  await next();
}
