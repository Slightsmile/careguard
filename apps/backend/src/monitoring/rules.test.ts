import { describe, it, expect } from "vitest";
import { detectAnomalies, computeOverallSeverity } from "./rules";

const baseInput = {
  statusCode: 200,
  responseTimeMs: 150,
  recordsReturned: 50,
  responseTimeThresholdMs: 3000,
};

describe("detectAnomalies", () => {
  it("returns no anomalies for a healthy response", () => {
    expect(detectAnomalies(baseInput)).toEqual([]);
  });

  it("flags SERVER_ERROR for status >= 500", () => {
    const anomalies = detectAnomalies({ ...baseInput, statusCode: 500 });
    expect(anomalies.map((a) => a.type)).toContain("SERVER_ERROR");
  });

  it("flags HTTP_ERROR for 4xx status", () => {
    const anomalies = detectAnomalies({ ...baseInput, statusCode: 404 });
    expect(anomalies.map((a) => a.type)).toContain("HTTP_ERROR");
  });

  it("flags HIGH_RESPONSE_TIME when over threshold", () => {
    const anomalies = detectAnomalies({ ...baseInput, responseTimeMs: 5000 });
    expect(anomalies.map((a) => a.type)).toContain("HIGH_RESPONSE_TIME");
  });

  it("flags ZERO_RECORDS when records are empty", () => {
    const anomalies = detectAnomalies({ ...baseInput, recordsReturned: 0 });
    expect(anomalies.map((a) => a.type)).toContain("ZERO_RECORDS");
  });

  it("flags INVALID_RESPONSE when records are missing on a 200", () => {
    const anomalies = detectAnomalies({ ...baseInput, recordsReturned: null });
    expect(anomalies.map((a) => a.type)).toContain("INVALID_RESPONSE");
  });

  it("flags multiple anomalies for 500 + slow + zero records", () => {
    const anomalies = detectAnomalies({
      statusCode: 500,
      responseTimeMs: 5500,
      recordsReturned: 0,
      responseTimeThresholdMs: 3000,
    });
    const types = anomalies.map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(["SERVER_ERROR", "HIGH_RESPONSE_TIME", "ZERO_RECORDS"])
    );
  });
});

describe("computeOverallSeverity", () => {
  it("returns INFO when there are no anomalies", () => {
    expect(computeOverallSeverity([])).toBe("INFO");
  });

  it("returns CRITICAL when any anomaly is CRITICAL", () => {
    expect(
      computeOverallSeverity([{ type: "SERVER_ERROR", severity: "CRITICAL", details: "" }])
    ).toBe("CRITICAL");
  });

  it("returns WARNING for a single warning-level anomaly", () => {
    expect(
      computeOverallSeverity([{ type: "ZERO_RECORDS", severity: "WARNING", details: "" }])
    ).toBe("WARNING");
  });

  it("escalates to CRITICAL when multiple warnings co-occur", () => {
    expect(
      computeOverallSeverity([
        { type: "ZERO_RECORDS", severity: "WARNING", details: "" },
        { type: "HIGH_RESPONSE_TIME", severity: "WARNING", details: "" },
      ])
    ).toBe("CRITICAL");
  });
});
