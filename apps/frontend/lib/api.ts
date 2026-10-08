import type {
  Alert,
  MonitoredAPI,
  MonitoringCheck,
  MonitorRunResponse,
  MockApiKey,
  MockScenario,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${init?.method ?? "GET"} ${path} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getApis: () => request<{ apis: MonitoredAPI[] }>("/apis"),

  getAlerts: (status?: "ACTIVE" | "RESOLVED") =>
    request<{ alerts: Alert[] }>(`/alerts${status ? `?status=${status}` : ""}`),

  getAlert: (id: string) => request<{ alert: Alert }>(`/alerts/${id}`),

  resolveAlert: (id: string) =>
    request<{ alert: Alert }>(`/alerts/${id}/resolve`, { method: "PATCH" }),

  getHistory: (limit = 50) =>
    request<{ checks: MonitoringCheck[] }>(`/monitor/history?limit=${limit}`),

  runMonitoring: () => request<MonitorRunResponse>("/monitor/run", { method: "POST" }),

  setMockScenario: (apiKey: MockApiKey, scenario: MockScenario) =>
    request<{ api: MockApiKey; scenario: MockScenario }>(`/mock/${apiKey}/scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),

  getHealth: () =>
    request<{ status: string; database: string; timestamp: string }>("/health"),
};
