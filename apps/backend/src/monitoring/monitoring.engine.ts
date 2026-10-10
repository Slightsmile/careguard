import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { detectAnomalies, computeOverallSeverity, type DetectedAnomaly } from "./rules";
import { handleAnomalies } from "../services/alert.service";
import { runLiveCheck } from "./live-check";

export interface RawCheckResult {
  apiName: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  errorMessage?: string | null;
}

export interface ProcessedCheckResult {
  apiName: string;
  apiId: string | null;
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  success: boolean;
  anomalies: DetectedAnomaly[];
  checkId: string | null;
}

/**
 * Processes one raw monitoring result: runs deterministic anomaly detection,
 * persists the check + any anomalies, and hands off to the alert service.
 */
export async function processCheckResult(raw: RawCheckResult): Promise<ProcessedCheckResult> {
  const api = await prisma.monitoredAPI.findUnique({ where: { name: raw.apiName } });

  const responseTimeThresholdMs = api?.responseTimeThreshold ?? 3000;

  const anomalies = detectAnomalies({
    statusCode: raw.statusCode,
    responseTimeMs: raw.responseTimeMs,
    recordsReturned: raw.recordsReturned,
    responseTimeThresholdMs,
  });

  const success = anomalies.length === 0;

  let checkId: string | null = null;

  if (api) {
    const check = await prisma.monitoringCheck.create({
      data: {
        apiId: api.id,
        statusCode: raw.statusCode,
        responseTimeMs: raw.responseTimeMs,
        recordsReturned: raw.recordsReturned,
        success,
        errorMessage: raw.errorMessage ?? null,
      },
    });
    checkId = check.id;

    if (anomalies.length > 0) {
      const overallSeverity = computeOverallSeverity(anomalies);

      const createdAnomalies = await Promise.all(
        anomalies.map((a) =>
          prisma.anomaly.create({
            data: {
              monitoringCheckId: check.id,
              type: a.type,
              severity: overallSeverity,
              details: a.details,
            },
          })
        )
      );

      await handleAnomalies({
        apiId: api.id,
        apiName: raw.apiName,
        statusCode: raw.statusCode,
        responseTimeMs: raw.responseTimeMs,
        recordsReturned: raw.recordsReturned,
        severity: overallSeverity,
        anomalies: createdAnomalies.map((created, i) => ({
          id: created.id,
          type: anomalies[i].type,
          details: anomalies[i].details,
        })),
      });
    }
  } else {
    logger.warn("Monitoring check received for unknown API", { apiName: raw.apiName });
  }

  logger.info("Monitoring check processed", {
    api: raw.apiName,
    statusCode: raw.statusCode,
    responseTimeMs: raw.responseTimeMs,
    recordsReturned: raw.recordsReturned,
    anomalyCount: anomalies.length,
  });

  return {
    apiName: raw.apiName,
    apiId: api?.id ?? null,
    statusCode: raw.statusCode,
    responseTimeMs: raw.responseTimeMs,
    recordsReturned: raw.recordsReturned,
    success,
    anomalies,
    checkId,
  };
}

/**
 * Batch processing entry point for the monitoring engine (master prompt section 6).
 */
export async function processBatch(rawResults: RawCheckResult[]): Promise<ProcessedCheckResult[]> {
  logger.info("Monitoring batch started", { count: rawResults.length });
  const results: ProcessedCheckResult[] = [];

  for (const raw of rawResults) {
    results.push(await processCheckResult(raw));
  }

  logger.info("Monitoring batch finished", {
    processed: results.length,
    healthy: results.filter((r) => r.success).length,
    anomalies: results.filter((r) => !r.success).length,
  });

  return results;
}

/**
 * Runs a live monitoring pass against every enabled MonitoredAPI.
 * Shared by the manual "Run Monitoring" endpoint and the automated scheduler.
 */
export async function runEnabledApis(): Promise<ProcessedCheckResult[]> {
  const apis = await prisma.monitoredAPI.findMany({ where: { enabled: true } });

  if (apis.length === 0) {
    return [];
  }

  const rawResults = await Promise.all(
    apis.map((api) => runLiveCheck({ name: api.name, url: api.url, method: api.method }))
  );

  return processBatch(rawResults);
}
