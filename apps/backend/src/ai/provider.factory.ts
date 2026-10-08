import { config } from "../utils/config";
import type { LLMProvider } from "./types";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";

export function createLLMProvider(): LLMProvider {
  switch (config.llm.provider) {
    case "openai":
      return new OpenAIProvider(config.llm.apiKey, config.llm.model);

    case "anthropic":
      return new AnthropicProvider(config.llm.apiKey, config.llm.model);

    case "openai-compatible":
      return new OpenAICompatibleProvider({
        baseUrl: config.llm.baseUrl,
        apiKey: config.llm.apiKey,
        model: config.llm.model,
        providerLabel: "Local Qwen (OpenAI-compatible)",
      });

    default:
      throw new Error(`Unknown LLM_PROVIDER: ${config.llm.provider}`);
  }
}
