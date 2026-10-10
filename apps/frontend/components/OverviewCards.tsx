interface OverviewCardsProps {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  activeAlerts: number;
}

function Card({
  label,
  value,
  tone,
  pulse,
  index,
}: {
  label: string;
  value: number;
  tone: string;
  pulse?: boolean;
  index: number;
}) {
  return (
    <div
      className="group relative animate-rise overflow-hidden rounded-xl border border-line bg-surface p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-display text-4xl font-medium tabular-nums ${tone}`}>{value}</p>
        {pulse && value > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulsering rounded-full bg-pulse" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse" />
          </span>
        )}
      </div>
    </div>
  );
}

export function OverviewCards({ total, healthy, warning, critical, activeAlerts }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Card label="Total APIs" value={total} tone="text-slate-100" index={0} />
      <Card label="Healthy" value={healthy} tone="text-pulse" index={1} />
      <Card label="Warning" value={warning} tone="text-amber-400" index={2} />
      <Card label="Critical" value={critical} tone="text-rose-400" index={3} />
      <Card label="Active Alerts" value={activeAlerts} tone="text-rose-400" index={4} />
    </div>
  );
}
