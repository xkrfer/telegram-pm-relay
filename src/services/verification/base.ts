import type {
  VerificationChallenge,
  IVerificationMethod,
} from "../../types/verification";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { Api } from "grammy";
import type { ParsedEnv } from "../../env";

export abstract class BaseVerificationMethod implements IVerificationMethod {
  abstract generateChallenge(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    token: string
  ): Promise<VerificationChallenge>;

  abstract verifyAnswer(
    db: DrizzleD1Database<typeof schema>,
    userId: string,
    token: string,
    answer: string
  ): Promise<boolean>;

  abstract sendVerificationMessage(
    db: DrizzleD1Database<typeof schema>,
    api: Api,
    env: ParsedEnv,
    userId: string,
    challenge: VerificationChallenge
  ): Promise<void>;
}
