import { z } from "zod";

/**
 * Cloudflare Workers Environment Type Definition
 */
export interface Env {
  // D1 Database binding
  DB: D1Database;

  // Secrets (set via wrangler secret)
  BOT_TOKEN: string;
  CLOUDFLARE_TURNSTILE_SECRET_KEY?: string;
  AI_VERIFICATION_API_KEY?: string;

  // Environment variables (in wrangler.jsonc vars)
  BOT_SECRET: string;
  ADMIN_UID: string;
  LANGUAGE: string;
  NOTIFY_INTERVAL: string;
  LOG_LEVEL: string;
  NODE_ENV: string;
  SILENT_HOURS: string;
  ADMIN_TIMEZONE: string;
  AUTO_WELCOME: string;
  WELCOME_MESSAGE: string;
  STATS_CACHE_TTL: string;
  RATE_LIMIT_COOLDOWN: string;
  RATE_LIMIT_PER_MINUTE: string;
  RATE_LIMIT_PER_HOUR: string;
  RATE_LIMIT_PENALTY_DURATION: string;
  VERIFICATION_REQUIRED: string;
  VERIFICATION_TIMEOUT: string;
  VERIFICATION_BASE_URL: string;
  CLOUDFLARE_TURNSTILE_SITE_KEY: string;
  AI_VERIFICATION_BASE_URL: string;
  AI_VERIFICATION_MODEL: string;
}

/**
 * Runtime environment variable validation schema
 */
const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  BOT_SECRET: z.string().min(1),
  ADMIN_UID: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val)),
  LANGUAGE: z
    .string()
    .default("en"),
  NOTIFY_INTERVAL: z
    .string()
    .default("3600000")
    .transform((val) => parseInt(val)),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.enum(["development", "production"]).default("production"),
  SILENT_HOURS: z.string().default("22:00-08:00"),
  ADMIN_TIMEZONE: z.string().default("Asia/Shanghai"),
  AUTO_WELCOME: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  WELCOME_MESSAGE: z.string().default("Hello! I have received your message and will reply as soon as possible."),
  STATS_CACHE_TTL: z
    .string()
    .default("300")
    .transform((val) => parseInt(val)),
  RATE_LIMIT_COOLDOWN: z
    .string()
    .default("3")
    .transform((val) => parseInt(val)),
  RATE_LIMIT_PER_MINUTE: z
    .string()
    .default("10")
    .transform((val) => parseInt(val)),
  RATE_LIMIT_PER_HOUR: z
    .string()
    .default("50")
    .transform((val) => parseInt(val)),
  RATE_LIMIT_PENALTY_DURATION: z
    .string()
    .default("60")
    .transform((val) => parseInt(val)),
  VERIFICATION_REQUIRED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  VERIFICATION_TIMEOUT: z
    .string()
    .default("900")
    .transform((val) => parseInt(val)),
  VERIFICATION_BASE_URL: z.string().url(),
  CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional().default(""),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  AI_VERIFICATION_API_KEY: z.string().optional().default(""),
  AI_VERIFICATION_BASE_URL: z
    .string()
    .optional()
    .default("https://api.openai.com/v1"),
  AI_VERIFICATION_MODEL: z.string().optional().default("gpt-4o-mini"),
});

export type ParsedEnv = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @param rawEnv - Workers environment object
 * @returns Parsed environment variables
 */
export function parseEnv(rawEnv: Env): ParsedEnv {
  return envSchema.parse(rawEnv);
}
