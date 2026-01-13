import type { IVerificationMethod } from "../../types/verification";
import { MathVerification } from "./math";
import { QuizVerification } from "./quiz";
import { TurnstileVerification } from "./turnstile";
import { AIVerification } from "./ai";

/**
 * 验证方式工厂函数
 * 根据验证方式返回对应的验证实例
 */
export function getVerificationMethod(
  method: "math" | "quiz" | "turnstile" | "ai"
): IVerificationMethod {
  switch (method) {
    case "math":
      return new MathVerification();
    case "quiz":
      return new QuizVerification();
    case "turnstile":
      return new TurnstileVerification();
    case "ai":
      return new AIVerification();
    default:
      throw new Error(`Unknown verification method: ${method}`);
  }
}
