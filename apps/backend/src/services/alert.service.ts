import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { generateAlert } from "../ai/llm.service";
import type { DetectedAnomaly, Severity } from "../monitoring/rules";

export interface PersistedAnomaly {
  id: string;
  type: DetectedAnomaly["type"];
  details: string;
}

export interface AnomalyBatchContext {
  apiId: string;
  apiName: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  recordsReturned: number | null;
  anomalies: PersistedAnomaly[];
  severity: Severity;
}

const SEVERITY_TITLES: Record<Severity, string> = {
  CRITICAL: "Critical",
  WARNING: "Warning",
  INFO: "Info",
};

/**
 * Generates an AI explanation for a batch of anomalies from one monitoring check
 * and persists a single consolidated Alert, linked to the highest-severity anomaly row.
 */
export async function handleAnomalies(context: AnomalyBatchContext): Promise<void> {
  const primaryAnomaly = context.anomalies[0];
  if (!primaryAnomaly) return;

  const existingActiveAlert = await prisma.alert.findFirst({
    where: {
      status: "ACTIVE",
      anomaly: { monitoringCheck: { apiId: context.apiId } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActiveAlert) {
    logger.info("Skipped duplicate alert; API already has an active alert", {
      api: context.apiName,
      existingAlertId: existingActiveAlert.id,
    });
    return;
  }

  const result = await generateAlert({
    apiName: context.apiName,
    statusCode: context.statusCode,
    responseTimeMs: context.responseTimeMs,
    recordsReturned: context.recordsReturned,
    anomalies: context.anomalies.map((a) => ({ type: a.type, details: a.details })),
    severity: context.severity,
  });

  await prisma.alert.create({
    data: {
      anomalyId: primaryAnomaly.id,
      title: `${SEVERITY_TITLES[context.severity]}: ${context.apiName}`,
      summary: result.summary,
      possibleCause: result.possibleCause,
      recommendedAction: result.recommendedAction,
      severity: context.severity,
      provider: result.provider,
      model: result.model,
    },
  });

  logger.info("Alert persisted", {
    api: context.apiName,
    severity: context.severity,
    provider: result.provider,
  });
}
