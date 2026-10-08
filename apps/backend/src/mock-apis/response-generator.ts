import type { MockScenario } from "./scenarios";

export interface MockApiResult {
  statusCode: number;
  delayMs: number;
  body: unknown;
}

function healthyRecords(apiName: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    source: apiName,
    updatedAt: new Date().toISOString(),
  }));
}

export function generateMockResponse(apiName: string, scenario: MockScenario): MockApiResult {
  const resolvedScenario: MockScenario =
    scenario === "RANDOM_INTERMITTENT"
      ? (["NORMAL", "HTTP_500", "SLOW", "ZERO_RECORDS"][Math.floor(Math.random() * 4)] as MockScenario)
      : scenario;

  switch (resolvedScenario) {
    case "NORMAL":
      return {
        statusCode: 200,
        delayMs: 100 + Math.floor(Math.random() * 150),
        body: { api_name: apiName, records: healthyRecords(apiName, 50) },
      };

    case "SLOW":
      return {
        statusCode: 200,
        delayMs: 3500 + Math.floor(Math.random() * 2000),
        body: { api_name: apiName, records: healthyRecords(apiName, 50) },
      };

    case "HTTP_400":
      return { statusCode: 400, delayMs: 80, body: { error: "Bad Request" } };

    case "HTTP_401":
      return { statusCode: 401, delayMs: 80, body: { error: "Unauthorized" } };

    case "HTTP_404":
      return { statusCode: 404, delayMs: 80, body: { error: "Not Found" } };

    case "HTTP_500":
      return {
        statusCode: 500,
        delayMs: 4000 + Math.floor(Math.random() * 2000),
        body: { error: "Internal Server Error" },
      };

    case "ZERO_RECORDS":
      return {
        statusCode: 200,
        delayMs: 120,
        body: { api_name: apiName, records: [] },
      };

    case "MISSING_FIELDS":
      return {
        statusCode: 200,
        delayMs: 120,
        // intentionally omits "records"
        body: { api_name: apiName },
      };

    case "INVALID_DATA":
      return {
        statusCode: 200,
        delayMs: 120,
        // records is not an array
        body: { api_name: apiName, records: "not-an-array" },
      };

    default:
      return {
        statusCode: 200,
        delayMs: 100,
        body: { api_name: apiName, records: healthyRecords(apiName, 50) },
      };
  }
}
