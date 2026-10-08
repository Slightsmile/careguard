import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../utils/prisma";

const TEST_API_NAME = "IntegrationTestAPI";

beforeAll(async () => {
  await prisma.monitoredAPI.upsert({
    where: { name: TEST_API_NAME },
    update: {},
    create: { name: TEST_API_NAME, url: "http://localhost:4000/mock/patients" },
  });
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

describe("POST /monitor", () => {
  it("rejects an empty array", async () => {
    const res = await request(app).post("/monitor").send([]);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejects a payload missing api_name", async () => {
    const res = await request(app)
      .post("/monitor")
      .send([{ status_code: 200, response_time_ms: 100 }]);
    expect(res.status).toBe(400);
  });

  it("rejects a non-array payload", async () => {
    const res = await request(app).post("/monitor").send({ api_name: "x" });
    expect(res.status).toBe(400);
  });

  it("processes a healthy record and reports no anomalies", async () => {
    const res = await request(app)
      .post("/monitor")
      .send([{ api_name: TEST_API_NAME, status_code: 200, response_time_ms: 120, records_returned: 50 }]);

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(res.body.healthy).toBe(1);
    expect(res.body.anomalies).toBe(0);
  });

  it("processes an anomalous record and returns alert info", async () => {
    const res = await request(app)
      .post("/monitor")
      .send([{ api_name: TEST_API_NAME, status_code: 500, response_time_ms: 5500, records_returned: 0 }]);

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(res.body.anomalies).toBe(1);
    expect(res.body.alerts[0].anomalies).toEqual(
      expect.arrayContaining(["SERVER_ERROR", "HIGH_RESPONSE_TIME", "ZERO_RECORDS"])
    );
  });
});

describe("unknown routes", () => {
  it("returns 404 for an undefined route", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});
