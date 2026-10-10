"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Alert, MonitoredAPI, MonitoringCheck, Severity } from "@/types/api";
import { OverviewCards } from "@/components/OverviewCards";
import { ApiStatusTable, type ApiRow } from "@/components/ApiStatusTable";
import { AlertsTable } from "@/components/AlertsTable";
import { SimulationControls } from "@/components/SimulationControls";

function buildApiRows(apis: MonitoredAPI[], checks: MonitoringCheck[]): ApiRow[] {
  return apis.map((monitoredApi) => {
    const latestCheck = checks.find((c) => c.apiId === monitoredApi.id) ?? null;
    const activeAnomalies = latestCheck?.anomalies ?? [];

    let severity: Severity | "HEALTHY" = "HEALTHY";
    if (activeAnomalies.some((a) => a.severity === "CRITICAL")) severity = "CRITICAL";
    else if (activeAnomalies.length > 0) severity = "WARNING";

    return { api: monitoredApi, latestCheck, severity };
  });
}

export default function DashboardPage() {
  const [apis, setApis] = useState<MonitoredAPI[]>([]);
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [apisRes, historyRes, alertsRes] = await Promise.all([
        api.getApis(),
        api.getHistory(100),
        api.getAlerts("ACTIVE"),
      ]);
      setApis(apisRes.apis);
      setChecks(historyRes.checks);
      setAlerts(alertsRes.alerts);
      setError(null);
    } catch {
      setError("Unable to reach the CareGuard backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleRunMonitoring() {
    setRunning(true);
    try {
      await api.runMonitoring();
      await loadData();
    } finally {
      setRunning(false);
    }
  }

  const rows = buildApiRows(apis, checks);
  const healthy = rows.filter((r) => r.severity === "HEALTHY").length;
  const warning = rows.filter((r) => r.severity === "WARNING").length;
  const critical = rows.filter((r) => r.severity === "CRITICAL").length;

  return (
    <main className="relative min-h-screen bg-grid">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CareGuard" className="h-11 w-11 object-contain" />
            <div>
              <h1 className="font-display text-2xl font-medium italic text-slate-50">CareGuard</h1>
              <p className="text-xs tracking-wide text-slate-500">Intelligent API Monitoring &amp; Alert System</p>
            </div>
          </div>
          <button
            onClick={handleRunMonitoring}
            disabled={running}
            className="group relative overflow-hidden rounded-lg border border-pulse/30 bg-pulsedim/30 px-4 py-2.5 text-sm font-medium text-pulse shadow-glow transition-all hover:border-pulse/50 hover:bg-pulsedim/50 disabled:opacity-50"
          >
            {running ? "Running…" : "Run Monitoring"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse" />
            Connecting to CareGuard…
          </div>
        ) : (
          <div className="space-y-8">
            <OverviewCards
              total={rows.length}
              healthy={healthy}
              warning={warning}
              critical={critical}
              activeAlerts={alerts.length}
            />

            <SimulationControls onChange={loadData} />

            <section>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                API Status
              </h2>
              <ApiStatusTable rows={rows} />
            </section>

            <section>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Active Alerts
              </h2>
              <AlertsTable alerts={alerts} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
