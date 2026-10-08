import { describe, it, expect } from "vitest";
import { buildFallbackAlert } from "./fallback";

describe("buildFallbackAlert", () => {
  it("builds a deterministic summary from available fields", () => {
    const result = buildFallbackAlert({
      apiName: "AppointmentAPI",
      statusCode: 500,
      responseTimeMs: 5500,
      recordsReturned: 0,
      anomalies: [],
      severity: "CRITICAL",
    });

    expect(result.summary).toContain("AppointmentAPI");
    expect(result.summary).toContain("HTTP 500");
    expect(result.summary).toContain("5500ms");
    expect(result.provider).toBe("fallback");
    expect(result.severity).toBe("CRITICAL");
  });

  it("omits null fields from the summary", () => {
    const result = buildFallbackAlert({
      apiName: "StaffAPI",
      statusCode: null,
      responseTimeMs: null,
      recordsReturned: null,
      anomalies: [],
      severity: "WARNING",
    });

    expect(result.summary).not.toContain("HTTP");
    expect(result.summary).not.toContain("ms.");
  });
});
