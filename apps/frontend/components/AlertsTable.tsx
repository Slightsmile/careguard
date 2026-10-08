import Link from "next/link";
import type { Alert } from "@/types/api";
import { severityStyles, formatDateTime } from "@/lib/format";

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        No active alerts.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">API</th>
            <th className="px-4 py-2 font-medium">Severity</th>
            <th className="px-4 py-2 font-medium">Alert</th>
            <th className="px-4 py-2 font-medium">Possible Cause</th>
            <th className="px-4 py-2 font-medium">Recommended Action</th>
            <th className="px-4 py-2 font-medium">Time</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-2 font-medium text-slate-900">
                <Link href={`/alerts/${alert.id}`} className="hover:underline">
                  {alert.anomaly?.monitoringCheck?.api?.name ?? "Unknown"}
                </Link>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[alert.severity]}`}
                >
                  {alert.severity}
                </span>
              </td>
              <td className="max-w-xs truncate px-4 py-2 text-slate-700">{alert.summary}</td>
              <td className="max-w-xs truncate px-4 py-2 text-slate-500">{alert.possibleCause ?? "—"}</td>
              <td className="max-w-xs truncate px-4 py-2 text-slate-500">{alert.recommendedAction ?? "—"}</td>
              <td className="px-4 py-2 text-slate-500">{formatDateTime(alert.createdAt)}</td>
              <td className="px-4 py-2 text-slate-700">{alert.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
