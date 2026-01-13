import { messages } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema";

export async function saveMessage(
  db: DrizzleD1Database<typeof schema>,
  userTelegramId: string,
  messageId: string,
  direction: "in" | "out",
  message: any,
  tx?: any
) {
  try {
    // Determine message type
    let messageType:
      | "text"
      | "photo"
      | "video"
      | "document"
      | "voice"
      | "sticker"
      | "animation"
      | "location"
      | "contact" = "text";
    let content: string | null = null;

    if (message.text) {
      messageType = "text";
      content = message.text;
    } else if (message.photo) {
      messageType = "photo";
      content = message.caption || null;
    } else if (message.video) {
      messageType = "video";
      content = message.caption || null;
    } else if (message.document) {
      messageType = "document";
      content = message.caption || null;
    } else if (message.voice) {
      messageType = "voice";
      content = null;
    } else if (message.sticker) {
      messageType = "sticker";
      content = null;
    } else if (message.animation) {
      messageType = "animation";
      content = message.caption || null;
    } else if (message.location) {
      messageType = "location";
      content = null;
    } else if (message.contact) {
      messageType = "contact";
      content = null;
    }

    const dbOrTx = tx || db;
    const [savedMessage] = await dbOrTx
      .insert(messages)
      .values({
        userTelegramId: userTelegramId,
        messageId: messageId,
        direction,
        messageType,
        content,
        rawData: JSON.stringify(message),
        mediaGroupId: message.media_group_id || null,
      })
      .returning();

    return savedMessage;
  } catch (error) {
    console.error("Failed to save message:", error);
    return null;
  }
}

export async function getMessageHistory(
  db: DrizzleD1Database<typeof schema>,
  userTelegramId: string,
  limit: number = 20,
  offset: number = 0
) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.userTelegramId, userTelegramId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
}
