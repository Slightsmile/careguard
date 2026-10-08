import { z } from "zod";

export const llmResponseSchema = z.object({
  summary: z.string().min(1),
  possible_cause: z.string().min(1),
  recommended_action: z.string().min(1),
});

export type LLMResponseShape = z.infer<typeof llmResponseSchema>;

/**
 * Extracts and validates a JSON object from raw LLM text output.
 * Handles cases where the model wraps JSON in markdown code fences.
 */
export function parseLLMResponse(raw: string): LLMResponseShape {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return llmResponseSchema.parse(parsed);
}
