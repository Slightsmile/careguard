interface OverviewCardsProps {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  activeAlerts: number;
}

function Card({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

export function OverviewCards({ total, healthy, warning, critical, activeAlerts }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <Card label="Total APIs" value={total} />
      <Card label="Healthy" value={healthy} accent="text-emerald-600" />
      <Card label="Warning" value={warning} accent="text-amber-600" />
      <Card label="Critical" value={critical} accent="text-red-600" />
      <Card label="Active Alerts" value={activeAlerts} accent="text-red-600" />
    </div>
  );
}
