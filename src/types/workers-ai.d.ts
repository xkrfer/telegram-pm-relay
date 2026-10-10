// Qwen uses chat-completion inputs/outputs, unlike legacy Workers AI models.
// This model is absent from the bundled Wrangler catalog.
interface AiModels {
  "@cf/qwen/qwen3.8-27b": {
    inputs: {
      messages: { role: "system" | "user" | "assistant"; content: string }[];
      response_format: {
        type: "json_schema";
        json_schema: { name: string; strict: boolean; schema: unknown };
      };
      max_completion_tokens: number;
      reasoning_effort: "low" | "medium" | "xhigh";
      temperature: number;
      stream: false;
    };
    postProcessedOutputs: {
      choices?: {
        finish_reason?: string;
        message?: { content?: string | null; refusal?: string | null };
      }[];
    };
  };
}
