export type VerificationMethod = "none" | "math" | "quiz" | "ai";

export interface VerificationConfig {
  enabled: boolean;
  method: VerificationMethod;
  timeout: number;
  ai?: {
    model: string;
  };
}

export interface VerificationData {
  method?: VerificationMethod;
  question?: string;
  options?: string[];
  correctAnswer?: number | string;
  messageId?: number;
}

export interface VerificationChallenge {
  token: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  expiresAt: number; // Unix timestamp
}

export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
  missing?: string[];
}

export interface IVerificationMethod {
  /**
   * 生成验证挑战
   */
  generateChallenge(
    db: any,
    api: any,
    env: any,
    userId: string,
    token: string
  ): Promise<VerificationChallenge>;

  /**
   * 验证用户答案
   */
  verifyAnswer(
    db: any,
    userId: string,
    token: string,
    answer: string
  ): Promise<boolean>;

  /**
   * 发送验证消息
   */
  sendVerificationMessage(
    db: any,
    api: any,
    env: any,
    userId: string,
    challenge: VerificationChallenge
  ): Promise<void>;
}
