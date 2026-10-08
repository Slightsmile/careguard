import Anthropic from "@anthropic-ai/sdk";
import type { AlertContext, AlertResult, LLMProvider } from "../types";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import { parseLLMResponse } from "../response-schema";

export class AnthropicProvider implements LLMProvider {
  readonly name = "Anthropic";
  readonly model: string;
  private readonly client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async generateAlert(context: AlertContext): Promise<AlertResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(context) }],
    });

    const block = message.content[0];
    const raw = block?.type === "text" ? block.text : "";
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
