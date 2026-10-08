import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { processBatch, runEnabledApis, type RawCheckResult } from "../monitoring/monitoring.engine";
import { asyncHandler } from "../middleware/async-handler";

export const monitorRouter = Router();

const monitorEntrySchema = z.object({
  api_name: z.string().min(1),
  status_code: z.number().int().nullable().optional(),
  response_time_ms: z.number().nullable().optional(),
  records_returned: z.number().int().nullable().optional(),
});

const monitorPayloadSchema = z.array(monitorEntrySchema).min(1);

monitorRouter.post(
  "/monitor",
  asyncHandler(async (req, res) => {
    const parsed = monitorPayloadSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid monitoring payload", details: parsed.error.flatten() });
      return;
    }

    const rawResults: RawCheckResult[] = parsed.data.map((entry) => ({
      apiName: entry.api_name,
      statusCode: entry.status_code ?? null,
      responseTimeMs: entry.response_time_ms ?? null,
      recordsReturned: entry.records_returned ?? null,
    }));

    const results = await processBatch(rawResults);

    res.json({
      processed: results.length,
      healthy: results.filter((r) => r.success).length,
      anomalies: results.filter((r) => !r.success).length,
      alerts: results
        .filter((r) => !r.success)
        .map((r) => ({
          api: r.apiName,
          anomalies: r.anomalies.map((a) => a.type),
        })),
    });
  })
);

monitorRouter.post(
  "/monitor/run",
  asyncHandler(async (_req, res) => {
    logger.info("Manual monitoring run triggered");

    const results = await runEnabledApis();

    res.json({
      processed: results.length,
      healthy: results.filter((r) => r.success).length,
      anomalies: results.filter((r) => !r.success).length,
      alerts: results
        .filter((r) => !r.success)
        .map((r) => ({
          api: r.apiName,
          anomalies: r.anomalies.map((a) => a.type),
        })),
    });
  })
);

monitorRouter.get(
  "/monitor/history",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);

    const checks = await prisma.monitoringCheck.findMany({
      take: limit,
      orderBy: { checkedAt: "desc" },
      include: { api: true, anomalies: true },
    });

    res.json({ checks });
  })
);
