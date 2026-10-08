import type { MonitoredAPI, MonitoringCheck, Severity } from "@/types/api";
import { statusCodeStyle, formatDateTime, severityStyles } from "@/lib/format";

export interface ApiRow {
  api: MonitoredAPI;
  latestCheck: MonitoringCheck | null;
  severity: Severity | "HEALTHY";
}

const healthLabelStyles: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-800 border-emerald-300",
  ...severityStyles,
};

export function ApiStatusTable({ rows }: { rows: ApiRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">API</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">HTTP</th>
            <th className="px-4 py-2 font-medium">Response Time</th>
            <th className="px-4 py-2 font-medium">Records</th>
            <th className="px-4 py-2 font-medium">Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ api, latestCheck, severity }) => (
            <tr key={api.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2 font-medium text-slate-900">{api.name}</td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${healthLabelStyles[severity]}`}
                >
                  {severity}
                </span>
              </td>
              <td className={`px-4 py-2 ${statusCodeStyle(latestCheck?.statusCode ?? null)}`}>
                {latestCheck?.statusCode ?? "—"}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {latestCheck?.responseTimeMs !== undefined && latestCheck?.responseTimeMs !== null
                  ? `${latestCheck.responseTimeMs} ms`
                  : "—"}
              </td>
              <td className="px-4 py-2 text-slate-700">{latestCheck?.recordsReturned ?? "—"}</td>
              <td className="px-4 py-2 text-slate-500">
                {latestCheck ? formatDateTime(latestCheck.checkedAt) : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
