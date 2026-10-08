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
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">CareGuard</h1>
            <p className="text-sm text-slate-500">Intelligent API Monitoring &amp; Alert System</p>
          </div>
          <button
            onClick={handleRunMonitoring}
            disabled={running}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {running ? "Running..." : "Run Monitoring"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && (
          <>
            <OverviewCards
              total={rows.length}
              healthy={healthy}
              warning={warning}
              critical={critical}
              activeAlerts={alerts.length}
            />

            <SimulationControls onChange={loadData} />

            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">API Status</h2>
              <ApiStatusTable rows={rows} />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Active Alerts</h2>
              <AlertsTable alerts={alerts} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
