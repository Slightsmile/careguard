"use client";

import { useState } from "react";
import Link from "next/link";
import type { Alert } from "@/types/api";
import { severityStyles, severityDot, formatDateTimeParts } from "@/lib/format";

const PAGE_SIZE = 8;

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface/50 p-10 text-center">
        <p className="font-display text-lg italic text-slate-400">All clear.</p>
        <p className="mt-1 text-xs text-slate-500">No active alerts right now.</p>
      </div>
    );
  }

  const shown = alerts.slice(0, visible);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <th className="px-5 py-3 font-medium">API</th>
            <th className="px-5 py-3 font-medium">Severity</th>
            <th className="px-5 py-3 font-medium">Alert</th>
            <th className="px-5 py-3 font-medium">Possible Cause</th>
            <th className="px-5 py-3 font-medium">Recommended Action</th>
            <th className="px-5 py-3 font-medium">Time</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((alert, i) => {
            const { time, date } = formatDateTimeParts(alert.createdAt);
            return (
              <tr
                key={alert.id}
                className="animate-rise border-b border-line/60 transition-colors last:border-0 hover:bg-raised"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="px-5 py-3 font-medium text-slate-100">
                  <Link href={`/alerts/${alert.id}`} className="hover:text-pulse hover:underline">
                    {alert.anomaly?.monitoringCheck?.api?.name ?? "Unknown"}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[alert.severity]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${severityDot[alert.severity]}`} />
                    {alert.severity}
                  </span>
                </td>
                <td className="max-w-sm whitespace-normal break-words px-5 py-3 font-sans text-slate-300">
                  {alert.summary}
                </td>
                <td className="max-w-sm whitespace-normal break-words px-5 py-3 font-sans text-slate-50">
                  {alert.possibleCause ?? "—"}
                </td>
                <td className="max-w-sm whitespace-normal break-words px-5 py-3 font-sans text-slate-50">
                  {alert.recommendedAction ?? "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                  <div className="text-slate-300">{time}</div>
                  <div className="text-xs text-slate-600">{date}</div>
                </td>
                <td className="px-5 py-3 text-slate-300">{alert.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {visible < alerts.length && (
        <div className="border-t border-line p-3 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-pulse/40 hover:text-pulse"
          >
            Show more ({alerts.length - visible} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
