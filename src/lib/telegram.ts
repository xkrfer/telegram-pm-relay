import { Bot, type Api } from 'grammy';
import { DateTime } from 'luxon';
import type { ParsedEnv } from '../env';

/**
 * Create Bot instance
 */
export function createBot(token: string): Bot {
  return new Bot(token);
}

/**
 * Escape MarkdownV2 special characters
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

/**
 * Check if currently in silent hours
 */
export function shouldSendSilent(env: ParsedEnv): boolean {
  try {
    const [start, end] = env.SILENT_HOURS.split('-');
    const now = DateTime.now().setZone(env.ADMIN_TIMEZONE);
    const hour = now.hour;
    
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    if (startHour > endHour) {
      return hour >= startHour || hour < endHour;
    }
    
    return hour >= startHour && hour < endHour;
  } catch (error) {
    console.warn('Failed to check silent hours:', error);
    return false;
  }
}

/**
 * Send message (wrapper for Grammy API)
 */
export async function sendMessage(
  api: Api,
  chatId: bigint | number | string,
  text: string,
  env: ParsedEnv,
  options: any = {}
) {
  const isSilent = shouldSendSilent(env);
  
  return await api.sendMessage(chatId.toString(), text, {
    ...options,
    disable_notification: isSilent || options.disable_notification,
  });
}

/**
 * Forward message
 */
export async function forwardMessage(
  api: Api,
  toChatId: bigint | number | string,
  fromChatId: bigint | number | string,
  messageId: number
) {
  return await api.forwardMessage(
    toChatId.toString(),
    fromChatId.toString(),
    messageId
  );
}

/**
 * Copy message (without showing source)
 */
export async function copyMessage(
  api: Api,
  toChatId: bigint | number | string,
  fromChatId: bigint | number | string,
  messageId: number
) {
  return await api.copyMessage(
    toChatId.toString(),
    fromChatId.toString(),
    messageId
  );
}
