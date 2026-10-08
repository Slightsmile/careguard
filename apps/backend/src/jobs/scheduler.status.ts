export interface SchedulerStatus {
  running: boolean;
  intervalMs: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunResult: { processed: number; healthy: number; anomalies: number } | null;
}

const status: SchedulerStatus = {
  running: false,
  intervalMs: 0,
  lastRunAt: null,
  nextRunAt: null,
  lastRunResult: null,
};

export function initSchedulerStatus(intervalMs: number): void {
  status.running = true;
  status.intervalMs = intervalMs;
  status.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
}

export function recordRun(result: { processed: number; healthy: number; anomalies: number }): void {
  status.lastRunAt = new Date().toISOString();
  status.nextRunAt = new Date(Date.now() + status.intervalMs).toISOString();
  status.lastRunResult = result;
}

export function getSchedulerStatus(): SchedulerStatus {
  return { ...status };
}
