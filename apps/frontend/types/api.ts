export type Severity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "ACTIVE" | "RESOLVED";

export interface MonitoredAPI {
  id: string;
  name: string;
  url: string;
  method: string;
  enabled: boolean;
  responseTimeThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Anomaly {
  id: string;
  monitoringCheckId: string;
  type: string;
  severity: Severity;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MonitoringCheck {
  id: string;
  apiId: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  success: boolean;
  errorMessage: string | null;
  checkedAt: string;
  api?: MonitoredAPI;
  anomalies?: Anomaly[];
}

export interface Alert {
  id: string;
  anomalyId: string;
  title: string;
  summary: string;
  possibleCause: string | null;
  recommendedAction: string | null;
  severity: Severity;
  provider: string | null;
  model: string | null;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  anomaly?: Anomaly & {
    monitoringCheck?: MonitoringCheck;
  };
}

export interface MonitorRunResponse {
  processed: number;
  healthy: number;
  anomalies: number;
  alerts: Array<{ api: string; anomalies: string[] }>;
}

export const MOCK_SCENARIOS = [
  "NORMAL",
  "SLOW",
  "HTTP_400",
  "HTTP_401",
  "HTTP_404",
  "HTTP_500",
  "ZERO_RECORDS",
  "MISSING_FIELDS",
  "INVALID_DATA",
  "RANDOM_INTERMITTENT",
] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const MOCK_API_KEYS = ["patients", "appointments", "staff", "billing"] as const;
export type MockApiKey = (typeof MOCK_API_KEYS)[number];
