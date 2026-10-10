"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Alert } from "@/types/api";
import { severityStyles, severityDot, formatDateTime } from "@/lib/format";

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

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-grid text-sm text-slate-500">
        Loading…
      </main>
    );
  if (error || !alert)
    return (
      <main className="flex min-h-screen items-center justify-center bg-grid text-sm text-rose-400">
        {error ?? "Alert not found."}
      </main>
    );

  const check = alert.anomaly?.monitoringCheck;
  const allAnomalies = check?.anomalies ?? [];

  return (
    <main className="min-h-screen bg-grid">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-pulse"
        >
          ← Back to dashboard
        </Link>

        <div className="animate-rise overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line bg-raised/50 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-xl font-medium italic text-slate-50">
                  {check?.api?.name ?? "Unknown API"}
                </h1>
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[alert.severity]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${severityDot[alert.severity]}`} />
                  {alert.severity}
                </span>
              </div>
              {alert.status === "ACTIVE" ? (
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="rounded-lg border border-pulse/30 bg-pulsedim/30 px-4 py-2 text-sm font-medium text-pulse shadow-glow transition-all hover:border-pulse/50 hover:bg-pulsedim/50 disabled:opacity-50"
                >
                  {resolving ? "Resolving…" : "Resolve Alert"}
                </button>
              ) : (
                <span className="rounded-full border border-pulse/30 bg-pulsedim/30 px-2 py-0.5 text-xs font-medium text-pulse">
                  RESOLVED
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">HTTP Status</dt>
                <dd className="mt-1 font-medium text-slate-100">{check?.statusCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Response Time</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  {check?.responseTimeMs !== undefined && check?.responseTimeMs !== null
                    ? `${check.responseTimeMs} ms`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Records</dt>
                <dd className="mt-1 font-medium text-slate-100">{check?.recordsReturned ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-line pt-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Detected Anomalies
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {allAnomalies.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-full border border-line bg-raised px-3 py-1 text-xs text-slate-300"
                  >
                    {a.type}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-5 border-t border-line pt-5">
              <div>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">AI Summary</h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-slate-300">{alert.summary}</p>
              </div>
              <div>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Possible Cause
                </h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-slate-300">
                  {alert.possibleCause ?? "—"}
                </p>
              </div>
              <div>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Recommended Action
                </h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-pulse/90">
                  {alert.recommendedAction ?? "—"}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">LLM Provider</dt>
                <dd className="mt-1 font-medium text-slate-100">{alert.provider ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Model</dt>
                <dd className="mt-1 font-medium text-slate-100">{alert.model ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Detected</dt>
                <dd className="mt-1 font-medium text-slate-100">{formatDateTime(alert.createdAt)}</dd>
              </div>
              {alert.resolvedAt && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Resolved</dt>
                  <dd className="mt-1 font-medium text-slate-100">{formatDateTime(alert.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
