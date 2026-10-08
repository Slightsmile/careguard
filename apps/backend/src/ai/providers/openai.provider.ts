import { OpenAICompatibleProvider } from "./openai-compatible.provider";

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model: string) {
    super({
      baseUrl: "https://api.openai.com/v1",
      apiKey,
      model,
      providerLabel: "OpenAI",
    });
  }
}
