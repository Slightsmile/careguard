import { logger } from "../utils/logger";
import { createLLMProvider } from "./provider.factory";
import { buildFallbackAlert } from "./fallback";
import type { AlertContext, AlertResult } from "./types";

const provider = createLLMProvider();

/**
 * The only entry point the rest of the application should call.
 * Monitoring/business logic never talks to a provider directly (master prompt section 9).
 */
export async function generateAlert(context: AlertContext): Promise<AlertResult> {
  try {
    const result = await provider.generateAlert(context);
    logger.info("LLM alert generated", { provider: provider.name, model: provider.model, api: context.apiName });
    return result;
  } catch (error) {
    logger.error("LLM alert generation failed, using fallback", {
      provider: provider.name,
      model: provider.model,
      api: context.apiName,
      error: (error as Error).message,
    });
    return buildFallbackAlert(context);
  }
}

export const llmProviderInfo = { name: provider.name, model: provider.model };
