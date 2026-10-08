export type MockScenario =
  | "NORMAL"
  | "SLOW"
  | "HTTP_400"
  | "HTTP_401"
  | "HTTP_404"
  | "HTTP_500"
  | "ZERO_RECORDS"
  | "MISSING_FIELDS"
  | "INVALID_DATA"
  | "RANDOM_INTERMITTENT";

export const MOCK_SCENARIOS: MockScenario[] = [
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
];

export type MockApiKey = "patients" | "appointments" | "staff" | "billing";

export const MOCK_API_KEYS: MockApiKey[] = ["patients", "appointments", "staff", "billing"];

const currentScenarios = new Map<MockApiKey, MockScenario>(
  MOCK_API_KEYS.map((key) => [key, "NORMAL" as MockScenario])
);

export function getScenario(key: MockApiKey): MockScenario {
  return currentScenarios.get(key) ?? "NORMAL";
}

export function setScenario(key: MockApiKey, scenario: MockScenario): void {
  currentScenarios.set(key, scenario);
}

export function getAllScenarios(): Record<MockApiKey, MockScenario> {
  return Object.fromEntries(currentScenarios) as Record<MockApiKey, MockScenario>;
}
