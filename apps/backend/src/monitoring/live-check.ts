import { validateApiResponse } from "./validate-response";
import { logger } from "../utils/logger";
import type { RawCheckResult } from "./monitoring.engine";

export interface TargetApi {
  name: string;
  url: string;
  method: string;
}

/**
 * Performs an actual HTTP request against a configured (mock or real) API
 * and converts the raw HTTP outcome into a RawCheckResult for the monitoring engine.
 */
export async function runLiveCheck(target: TargetApi): Promise<RawCheckResult> {
  const startedAt = Date.now();

  try {
    const response = await fetch(target.url, { method: target.method });
    const responseTimeMs = Date.now() - startedAt;

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      return {
        apiName: target.name,
        statusCode: response.status,
        responseTimeMs,
        recordsReturned: null,
        errorMessage: `HTTP ${response.status}`,
      };
    }

    const { recordsReturned } = validateApiResponse(body);

    return {
      apiName: target.name,
      statusCode: response.status,
      responseTimeMs,
      recordsReturned,
      errorMessage: null,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    logger.error("Live check request failed", { api: target.name, error: (error as Error).message });
    return {
      apiName: target.name,
      statusCode: null,
      responseTimeMs,
      recordsReturned: null,
      errorMessage: (error as Error).message,
    };
  }
}
