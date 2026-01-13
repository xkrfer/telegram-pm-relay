import { systemConfig } from "../db/schema";
import { eq } from "drizzle-orm";
import type { ParsedEnv } from "../env";
import type {
  VerificationConfig,
  VerificationMethod,
  ConfigValidationResult,
} from "../types/verification";
import { getMessages, type Language } from "../i18n";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";

/**
 * Configuration Service Class
 * Manages system verification configuration (with caching)
 */
class ConfigService {
  private cache: Map<string, { config: VerificationConfig; time: number }> =
    new Map();
  private cacheTTL: number = 60000; // 1 minute cache

  /**
   * Get verification config (with caching)
   */
  async getVerificationConfig(
    db: DrizzleD1Database<typeof schema>,
    env: ParsedEnv
  ): Promise<VerificationConfig> {
    // Check cache
    const cacheKey = "verification_config";
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTTL) {
      return cached.config;
    }

    // Read from database
    const dbConfig = await db.query.systemConfig.findFirst();

    let config: VerificationConfig;

    if (dbConfig?.verification) {
      // Database config exists, parse JSON and add sensitive info
      const verificationData =
        typeof dbConfig.verification === "string"
          ? JSON.parse(dbConfig.verification)
          : dbConfig.verification;

      config = {
        ...verificationData,
        // Add Turnstile secret key
        turnstile: verificationData.turnstile
          ? {
              ...verificationData.turnstile,
              secretKey: env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
            }
          : undefined,
        // Add AI API Key
        ai: verificationData.ai
          ? {
              ...verificationData.ai,
              apiKey: env.AI_VERIFICATION_API_KEY,
            }
          : undefined,
      };
    } else {
      // Database config doesn't exist, use environment variables as defaults
      config = this.getDefaultConfig(env);
    }

    this.cache.set(cacheKey, { config, time: Date.now() });
    return config;
  }

  /**
   * Get default config (from environment variables)
   */
  private getDefaultConfig(env: ParsedEnv): VerificationConfig {
    return {
      enabled: env.VERIFICATION_REQUIRED,
      method: "math", // Default to math
      timeout: env.VERIFICATION_TIMEOUT,
    };
  }

  /**
   * Set verification method
   */
  async setVerificationMethod(
    db: DrizzleD1Database<typeof schema>,
    env: ParsedEnv,
    method: VerificationMethod,
    adminId: string,
    lang: Language = 'en'
  ): Promise<{ success: boolean; error?: string }> {
    const m = getMessages(lang);
    
    // Check config completeness
    const validation = await this.validateMethodConfig(method, env, lang);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const currentConfig = await this.getVerificationConfig(db, env);

      // Upsert config
      const existingConfig = await db.query.systemConfig.findFirst();

      const now = Math.floor(Date.now() / 1000);

      if (existingConfig) {
        // Update existing config
        await db
          .update(systemConfig)
          .set({
            verification: JSON.stringify({
              ...currentConfig,
              method,
            }),
            updatedAt: now,
            updatedBy: adminId,
          })
          .where(eq(systemConfig.id, existingConfig.id));
      } else {
        // Insert new config
        await db.insert(systemConfig).values({
          verification: JSON.stringify({
            ...currentConfig,
            method,
          }),
          updatedBy: adminId,
        });
      }

      // Clear cache
      this.invalidateCache();

      console.log("[ConfigService]", "Verification method updated", {
        method,
        adminId,
      });

      return { success: true };
    } catch (error) {
      console.error(
        "[ConfigService]",
        "Failed to set verification method",
        error
      );
      return { success: false, error: m.config.dbOperationFailed };
    }
  }

  /**
   * Enable/disable verification
   */
  async setVerificationEnabled(
    db: DrizzleD1Database<typeof schema>,
    env: ParsedEnv,
    enabled: boolean,
    adminId: string,
    lang: Language = 'en'
  ): Promise<{ success: boolean; error?: string }> {
    const m = getMessages(lang);
    
    try {
      const currentConfig = await this.getVerificationConfig(db, env);

      const existingConfig = await db.query.systemConfig.findFirst();

      const now = Math.floor(Date.now() / 1000);

      if (existingConfig) {
        await db
          .update(systemConfig)
          .set({
            verification: JSON.stringify({
              ...currentConfig,
              enabled,
            }),
            updatedAt: now,
            updatedBy: adminId,
          })
          .where(eq(systemConfig.id, existingConfig.id));
      } else {
        await db.insert(systemConfig).values({
          verification: JSON.stringify({
            ...currentConfig,
            enabled,
          }),
          updatedBy: adminId,
        });
      }

      this.invalidateCache();

      console.log("[ConfigService]", "Verification enabled state updated", {
        enabled,
        adminId,
      });

      return { success: true };
    } catch (error) {
      console.error(
        "[ConfigService]",
        "Failed to set verification enabled",
        error
      );
      return { success: false, error: m.config.dbOperationFailed };
    }
  }

  /**
   * Validate config completeness
   */
  async validateMethodConfig(
    method: VerificationMethod,
    env: ParsedEnv,
    lang: Language = 'en'
  ): Promise<ConfigValidationResult> {
    const m = getMessages(lang);
    
    switch (method) {
      case "none":
      case "math":
      case "quiz":
        return { valid: true };

      case "turnstile":
        const hasTurnstile =
          env.CLOUDFLARE_TURNSTILE_SITE_KEY &&
          env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

        if (!hasTurnstile) {
          return {
            valid: false,
            error: m.config.missingTurnstile,
            missing: [
              "CLOUDFLARE_TURNSTILE_SITE_KEY",
              "CLOUDFLARE_TURNSTILE_SECRET_KEY",
            ],
          };
        }
        return { valid: true };

      case "ai":
        const hasAI =
          env.AI_VERIFICATION_API_KEY &&
          env.AI_VERIFICATION_BASE_URL &&
          env.AI_VERIFICATION_MODEL;

        if (!hasAI) {
          return {
            valid: false,
            error: m.config.missingAI,
            missing: [
              "AI_VERIFICATION_API_KEY",
              "AI_VERIFICATION_BASE_URL",
              "AI_VERIFICATION_MODEL",
            ],
          };
        }
        return { valid: true };

      default:
        return { valid: false, error: m.config.unknownMethod };
    }
  }

  /**
   * Initialize default config
   * Migrates config from environment variables to database on first startup
   */
  async initializeDefaultConfig(
    db: DrizzleD1Database<typeof schema>,
    env: ParsedEnv
  ): Promise<void> {
    const existing = await db.query.systemConfig.findFirst();

    if (!existing) {
      // Read from environment variables and create default config
      const defaultConfig: VerificationConfig = {
        enabled: env.VERIFICATION_REQUIRED,
        method: "math", // Default to math
        timeout: env.VERIFICATION_TIMEOUT,
      };

      // If environment has Turnstile config, record Site Key
      if (env.CLOUDFLARE_TURNSTILE_SITE_KEY) {
        defaultConfig.turnstile = {
          siteKey: env.CLOUDFLARE_TURNSTILE_SITE_KEY,
        };
      }

      // If environment has AI config, record it
      if (env.AI_VERIFICATION_API_KEY) {
        defaultConfig.ai = {
          baseUrl: env.AI_VERIFICATION_BASE_URL,
          model: env.AI_VERIFICATION_MODEL,
        };
      }

      await db.insert(systemConfig).values({
        verification: JSON.stringify(defaultConfig),
        updatedBy: null, // System initialization
      });

      console.log(
        "[ConfigService]",
        "Initialized default verification config from environment variables"
      );
    }
  }

  /**
   * Clear cache
   */
  invalidateCache(): void {
    this.cache.clear();
  }
}

// Export singleton
export const configService = new ConfigService();
