import { afterEach, describe, expect, mock, test } from "bun:test";
import { parseEnv, type Env } from "../src/env";
import { AIVerification } from "../src/services/verification/ai";
import { configService } from "../src/services/config.service";
import worker from "../src/index";

function environment(response?: unknown) {
  const run = mock(async () => response);
  const env = parseEnv({
    BOT_TOKEN: "test", BOT_SECRET: "test", ADMIN_UID: "123",
    AI: { run },
  } as unknown as Env);
  return { env, run };
}
function database(verification?: object) {
  const set = mock(() => ({ where: async () => {} }));
  return {
    set,
    db: {
      update: () => ({ set }),
      query: { systemConfig: { findFirst: async () => verification ? { verification: JSON.stringify(verification) } : undefined } },
    } as any,
  };
}
afterEach(() => configService.invalidateCache());
const quiz = { question: "Which is a fruit?", options: ["Apple", "Rock", "Chair", "Cloud"], correct: 0 };

describe("Workers AI verification", () => {
  for (const response of [JSON.stringify(quiz), quiz]) {
    test(`accepts validated ${typeof response} output via the AI binding`, async () => {
      const { env, run } = environment({ response });
      const { db, set } = database();
      const challenge = await new AIVerification().generateChallenge(db, {} as any, env, "123", "token");
      expect(challenge.question).toBe(quiz.question);
      expect(challenge.correctAnswer).toBe(0);
      expect(run.mock.calls[0][0]).toBe("@cf/qwen/qwen3.8-27b");
      expect(JSON.parse(set.mock.calls[0][0].verificationData).method).toBe("ai");
    });
  }
  for (const response of [undefined, "not JSON", { ...quiz, correct: 0.5 }, { ...quiz, correct: 4 }, { ...quiz, options: ["a", "a", "b", "c"] }, { ...quiz, question: " " }]) {
    test(`rejects invalid output ${JSON.stringify(response)}`, async () => {
      const { env } = environment({ response });
      const { db, set } = database();
      await expect(new AIVerification().generateChallenge(db, {} as any, env, "123", "token")).rejects.toThrow();
      expect(set).not.toHaveBeenCalled();
    });
  }
  test("missing binding keeps non-AI verification usable and rejects AI", async () => {
    const env = parseEnv({ BOT_TOKEN: "test", BOT_SECRET: "test", ADMIN_UID: "123" } as Env);
    expect((await configService.validateMethodConfig("math", env)).valid).toBe(true);
    expect((await configService.validateMethodConfig("ai", env)).valid).toBe(false);
    const { db, set } = database();
    await expect(new AIVerification().generateChallenge(db, {} as any, env, "123", "token")).rejects.toThrow("binding");
    expect(set).not.toHaveBeenCalled();
  });
  test("binding failure does not persist a quiz", async () => {
    const { env, run } = environment();
    run.mockImplementation(async () => { throw new Error("AI unavailable"); });
    const { db, set } = database();
    await expect(new AIVerification().generateChallenge(db, {} as any, env, "123", "token")).rejects.toThrow("AI unavailable");
    expect(set).not.toHaveBeenCalled();
  });
  test("legacy configuration uses math and discards provider credentials", async () => {
    const { env } = environment();
    const { db } = database({ enabled: true, method: "turnstile", timeout: 900, turnstile: { secretKey: "old" }, ai: { apiKey: "old", baseUrl: "https://external.invalid" } });
    expect(await configService.getVerificationConfig(db, env)).toEqual({ enabled: true, method: "math", timeout: 900, ai: { model: env.AI_VERIFICATION_MODEL } });
  });
  test("retired web endpoints cannot verify a user", async () => {
    for (const method of ["GET", "POST"]) {
      const response = await worker.fetch(new Request("https://example.com/verify/token", { method }), {} as Env, {} as ExecutionContext);
      expect(response.status).toBe(404);
    }
  });
});
