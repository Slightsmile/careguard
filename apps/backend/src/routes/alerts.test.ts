import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../utils/prisma";

const TEST_API_NAME = "AlertsIntegrationTestAPI";
let alertId: string;

beforeAll(async () => {
  const api = await prisma.monitoredAPI.upsert({
    where: { name: TEST_API_NAME },
    update: {},
    create: { name: TEST_API_NAME, url: "http://localhost:4000/mock/billing" },
  });

  const check = await prisma.monitoringCheck.create({
    data: { apiId: api.id, statusCode: 500, responseTimeMs: 6000, recordsReturned: 0, success: false },
  });

  const anomaly = await prisma.anomaly.create({
    data: { monitoringCheckId: check.id, type: "SERVER_ERROR", severity: "CRITICAL", details: "test" },
  });

  const alert = await prisma.alert.create({
    data: {
      anomalyId: anomaly.id,
      title: "Critical: AlertsIntegrationTestAPI",
      summary: "test summary",
      possibleCause: "test cause",
      recommendedAction: "test action",
      severity: "CRITICAL",
      provider: "fallback",
      model: "none",
    },
  });

  alertId = alert.id;
});

afterAll(async () => {
  const api = await prisma.monitoredAPI.findUnique({ where: { name: TEST_API_NAME } });
  if (api) {
    const checks = await prisma.monitoringCheck.findMany({ where: { apiId: api.id } });
    for (const check of checks) {
      const anomalies = await prisma.anomaly.findMany({ where: { monitoringCheckId: check.id } });
      for (const anomaly of anomalies) {
        await prisma.alert.deleteMany({ where: { anomalyId: anomaly.id } });
      }
      await prisma.anomaly.deleteMany({ where: { monitoringCheckId: check.id } });
    }
    await prisma.monitoringCheck.deleteMany({ where: { apiId: api.id } });
    await prisma.monitoredAPI.delete({ where: { id: api.id } });
  }
  await prisma.$disconnect();
});

describe("GET /alerts", () => {
  it("returns a list including the seeded alert", async () => {
    const res = await request(app).get("/alerts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
    expect(res.body.alerts.some((a: { id: string }) => a.id === alertId)).toBe(true);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/alerts?status=ACTIVE");
    expect(res.status).toBe(200);
    expect(res.body.alerts.every((a: { status: string }) => a.status === "ACTIVE")).toBe(true);
  });
});

describe("GET /alerts/:id", () => {
  it("returns 404 for a nonexistent alert", async () => {
    const res = await request(app).get("/alerts/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns the alert with nested anomaly/check/api data", async () => {
    const res = await request(app).get(`/alerts/${alertId}`);
    expect(res.status).toBe(200);
    expect(res.body.alert.id).toBe(alertId);
    expect(res.body.alert.anomaly.monitoringCheck.api.name).toBe(TEST_API_NAME);
  });
});

describe("PATCH /alerts/:id/resolve", () => {
  it("returns 404 for a nonexistent alert", async () => {
    const res = await request(app).patch("/alerts/does-not-exist/resolve");
    expect(res.status).toBe(404);
  });

  it("resolves an active alert", async () => {
    const res = await request(app).patch(`/alerts/${alertId}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.alert.status).toBe("RESOLVED");
    expect(res.body.alert.resolvedAt).not.toBeNull();
  });
});
