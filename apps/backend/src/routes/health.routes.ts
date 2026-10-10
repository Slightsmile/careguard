import { Router } from "express";
import { prisma } from "../utils/prisma";
import { getSchedulerStatus } from "../jobs/scheduler.status";
import { llmProviderInfo } from "../ai/llm.service";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let databaseStatus: "healthy" | "unreachable" = "unreachable";

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = "healthy";
  } catch {
    databaseStatus = "unreachable";
  }

  const scheduler = getSchedulerStatus();

  res.json({
    status: databaseStatus === "healthy" ? "ok" : "degraded",
    database: databaseStatus,
    scheduler: {
      running: scheduler.running,
      armed: scheduler.armed,
      intervalMs: scheduler.intervalMs,
      lastRunAt: scheduler.lastRunAt,
      nextRunAt: scheduler.nextRunAt,
    },
    llm: {
      provider: llmProviderInfo.name,
      model: llmProviderInfo.model,
    },
    timestamp: new Date().toISOString(),
  });
});
