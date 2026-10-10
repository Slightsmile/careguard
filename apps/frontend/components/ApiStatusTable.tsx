import type { MonitoredAPI, MonitoringCheck, Severity } from "@/types/api";
import { statusCodeStyle, formatDateTime, severityDot } from "@/lib/format";

export interface ApiRow {
  api: MonitoredAPI;
  latestCheck: MonitoringCheck | null;
  severity: Severity | "HEALTHY";
}

const severityLabel: Record<string, string> = {
  HEALTHY: "text-pulse",
  CRITICAL: "text-rose-300",
  WARNING: "text-amber-300",
  INFO: "text-sky-300",
};

export function ApiStatusTable({ rows }: { rows: ApiRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <th className="px-5 py-3 font-medium">API</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">HTTP</th>
            <th className="px-5 py-3 font-medium">Response Time</th>
            <th className="px-5 py-3 font-medium">Records</th>
            <th className="px-5 py-3 font-medium">Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ api, latestCheck, severity }, i) => (
            <tr
              key={api.id}
              className="animate-rise border-b border-line/60 transition-colors last:border-0 hover:bg-raised"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="px-5 py-3 font-medium text-slate-100">{api.name}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${severityLabel[severity]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${severityDot[severity]}`} />
                  {severity}
                </span>
              </td>
              <td className={`px-5 py-3 ${statusCodeStyle(latestCheck?.statusCode ?? null)}`}>
                {latestCheck?.statusCode ?? "—"}
              </td>
              <td className="px-5 py-3 text-slate-300">
                {latestCheck?.responseTimeMs !== undefined && latestCheck?.responseTimeMs !== null
                  ? `${latestCheck.responseTimeMs} ms`
                  : "—"}
              </td>
              <td className="px-5 py-3 text-slate-300">{latestCheck?.recordsReturned ?? "—"}</td>
              <td className="px-5 py-3 text-slate-500">
                {latestCheck ? formatDateTime(latestCheck.checkedAt) : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
