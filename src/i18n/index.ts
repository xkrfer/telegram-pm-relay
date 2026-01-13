/**
 * i18n Core Module
 * Provides language detection and message retrieval
 */
import type { Messages, Language } from './types';
import { en } from './en';
import { zh } from './zh';

/**
 * All available language packs
 */
const messages: Record<Language, Messages> = { en, zh };

/**
 * Get language from environment variable
 * @param env - Environment object containing LANGUAGE variable
 * @returns Language code ('en' or 'zh')
 */
export function getLang(env: { LANGUAGE?: string }): Language {
  const lang = env.LANGUAGE?.toLowerCase();
  if (lang === 'zh' || lang === 'zh-cn' || lang === 'zh-tw' || lang === 'chinese') {
    return 'zh';
  }
  return 'en'; // Default to English
}

/**
 * Get messages object for a specific language
 * @param lang - Language code
 * @returns Messages object for the language
 */
export function getMessages(lang: Language): Messages {
  return messages[lang];
}

/**
 * Format duration in human-readable format
 * @param lang - Language code
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(lang: Language, seconds: number): string {
  const m = getMessages(lang);
  if (seconds < 60) {
    return m.duration.seconds(seconds);
  } else if (seconds < 3600) {
    return m.duration.minutes(Math.ceil(seconds / 60));
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return m.duration.hoursMinutes(hours, minutes);
  }
}

// Re-export types
export type { Messages, Language, QuizQuestion } from './types';
