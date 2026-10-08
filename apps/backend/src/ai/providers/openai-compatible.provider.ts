import OpenAI from "openai";
import type { AlertContext, AlertResult, LLMProvider } from "../types";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import { parseLLMResponse } from "../response-schema";

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  providerLabel: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  private readonly client: OpenAI;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.providerLabel;
    this.model = config.model;
    this.client = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
  }

  async generateAlert(context: AlertContext): Promise<AlertResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(context) },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseLLMResponse(raw);

    return {
      summary: parsed.summary,
      severity: context.severity,
      possibleCause: parsed.possible_cause,
      recommendedAction: parsed.recommended_action,
      provider: this.name,
      model: this.model,
    };
  }
}
