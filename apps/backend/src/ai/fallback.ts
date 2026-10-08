import type { AlertContext, AlertResult } from "./types";

export function buildFallbackAlert(context: AlertContext): AlertResult {
  const parts: string[] = [`${context.apiName} returned`];

  if (context.statusCode !== null) parts.push(`HTTP ${context.statusCode}.`);
  if (context.responseTimeMs !== null) parts.push(`Response time was ${context.responseTimeMs}ms.`);
  if (context.recordsReturned !== null) {
    parts.push(`${context.recordsReturned} record${context.recordsReturned === 1 ? "" : "s"} returned.`);
  }

  return {
    summary: parts.join(" "),
    severity: context.severity,
    possibleCause: "Unable to determine — AI analysis unavailable.",
    recommendedAction: "Investigate the API manually and check service logs.",
    provider: "fallback",
    model: "none",
  };
}
