"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Alert } from "@/types/api";
import { severityStyles, formatDateTime } from "@/lib/format";

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getAlert(params.id);
      setAlert(res.alert);
      setError(null);
    } catch {
      setError("Unable to load this alert.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve() {
    if (!alert) return;
    setResolving(true);
    try {
      await api.resolveAlert(alert.id);
      await load();
    } finally {
      setResolving(false);
    }
  }

  if (loading) return <main className="p-8 text-sm text-slate-500">Loading...</main>;
  if (error || !alert) return <main className="p-8 text-sm text-red-600">{error ?? "Alert not found."}</main>;

  const check = alert.anomaly?.monitoringCheck;
  const allAnomalies = check?.anomalies ?? [];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Back to dashboard
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {check?.api?.name ?? "Unknown API"}
              </h1>
              <span
                className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[alert.severity]}`}
              >
                {alert.severity}
              </span>
            </div>
            {alert.status === "ACTIVE" ? (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {resolving ? "Resolving..." : "Resolve Alert"}
              </button>
            ) : (
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                RESOLVED
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">HTTP Status</dt>
              <dd className="font-medium text-slate-900">{check?.statusCode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Response Time</dt>
              <dd className="font-medium text-slate-900">
                {check?.responseTimeMs !== undefined && check?.responseTimeMs !== null
                  ? `${check.responseTimeMs} ms`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Records</dt>
              <dd className="font-medium text-slate-900">{check?.recordsReturned ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Detected Anomalies</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              {allAnomalies.map((a) => (
                <li key={a.id}>{a.type}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">AI Summary</h2>
              <p className="mt-1 text-sm text-slate-700">{alert.summary}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Possible Cause</h2>
              <p className="mt-1 text-sm text-slate-700">{alert.possibleCause ?? "—"}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Recommended Action</h2>
              <p className="mt-1 text-sm text-slate-700">{alert.recommendedAction ?? "—"}</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
            <div>
              <dt className="text-slate-500">LLM Provider</dt>
              <dd className="font-medium text-slate-900">{alert.provider ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Model</dt>
              <dd className="font-medium text-slate-900">{alert.model ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Detected</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(alert.createdAt)}</dd>
            </div>
            {alert.resolvedAt && (
              <div>
                <dt className="text-slate-500">Resolved</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(alert.resolvedAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </main>
  );
}
