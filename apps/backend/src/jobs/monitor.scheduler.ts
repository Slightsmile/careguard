import { logger } from "../utils/logger";
import { runEnabledApis } from "../monitoring/monitoring.engine";
import { initSchedulerStatus, recordRun } from "./scheduler.status";

async function runScheduledCheck(): Promise<void> {
  try {
    const results = await runEnabledApis();
    const summary = {
      processed: results.length,
      healthy: results.filter((r) => r.success).length,
      anomalies: results.filter((r) => !r.success).length,
    };
    recordRun(summary);
    logger.info("Scheduled monitoring run completed", summary);
  } catch (error) {
    logger.error("Scheduled monitoring run failed", { error: (error as Error).message });
  }
}

export function startMonitorScheduler(intervalMs: number): void {
  initSchedulerStatus(intervalMs);
  logger.info("Monitoring scheduler started", { intervalMs });

  setInterval(runScheduledCheck, intervalMs);
}
