import type { AnomalyType, Severity } from "../monitoring/rules";

export interface AlertContext {
  apiName: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  anomalies: Array<{ type: AnomalyType; details: string }>;
  severity: Severity;
}

export interface AlertResult {
  summary: string;
  severity: Severity;
  possibleCause: string;
  recommendedAction: string;
  provider: string;
  model: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  generateAlert(context: AlertContext): Promise<AlertResult>;
}
