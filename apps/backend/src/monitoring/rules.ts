import { config } from "../utils/config";

export type AnomalyType =
  | "HIGH_RESPONSE_TIME"
  | "SERVER_ERROR"
  | "HTTP_ERROR"
  | "ZERO_RECORDS"
  | "INVALID_RESPONSE";

export type Severity = "INFO" | "WARNING" | "CRITICAL";

export interface DetectedAnomaly {
  type: AnomalyType;
  severity: Severity;
  details: string;
}

export interface CheckInput {
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  responseTimeThresholdMs: number;
}

/**
 * Pure, deterministic anomaly detection. No LLM involvement — see master prompt section 4.
 */
export function detectAnomalies(input: CheckInput): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const { statusCode, responseTimeMs, recordsReturned, responseTimeThresholdMs } = input;

  if (statusCode !== null && statusCode >= config.monitoring.serverErrorStatusCode) {
    anomalies.push({
      type: "SERVER_ERROR",
      severity: "CRITICAL",
      details: `API responded with server error status ${statusCode}.`,
    });
  } else if (statusCode !== null && statusCode >= config.monitoring.clientErrorStatusCode) {
    anomalies.push({
      type: "HTTP_ERROR",
      severity: "WARNING",
      details: `API responded with client error status ${statusCode}.`,
    });
  }

  if (responseTimeMs !== null && responseTimeMs > responseTimeThresholdMs) {
    anomalies.push({
      type: "HIGH_RESPONSE_TIME",
      severity: "WARNING",
      details: `Response time ${responseTimeMs}ms exceeded threshold of ${responseTimeThresholdMs}ms.`,
    });
  }

  if (recordsReturned !== null && recordsReturned === 0) {
    anomalies.push({
      type: "ZERO_RECORDS",
      severity: "WARNING",
      details: "API returned zero records.",
    });
  }

  if (recordsReturned === null && statusCode !== null && statusCode < config.monitoring.clientErrorStatusCode) {
    anomalies.push({
      type: "INVALID_RESPONSE",
      severity: "WARNING",
      details: "API response was missing expected fields or had an invalid structure.",
    });
  }

  return anomalies;
}

/**
 * Deterministic severity escalation: CRITICAL if any anomaly is CRITICAL,
 * or if multiple WARNING-level anomalies co-occur (e.g. 500 + zero records).
 */
export function computeOverallSeverity(anomalies: DetectedAnomaly[]): Severity {
  if (anomalies.length === 0) return "INFO";
  if (anomalies.some((a) => a.severity === "CRITICAL")) return "CRITICAL";
  if (anomalies.length >= 2) return "CRITICAL";
  return "WARNING";
}
