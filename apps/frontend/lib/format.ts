import type { Severity } from "@/types/api";

export const severityStyles: Record<Severity, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  WARNING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  INFO: "bg-sky-500/10 text-sky-300 border-sky-500/30",
};

export const severityDot: Record<Severity | "HEALTHY", string> = {
  CRITICAL: "bg-rose-400",
  WARNING: "bg-amber-400",
  INFO: "bg-sky-400",
  HEALTHY: "bg-pulse",
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatDateTimeParts(iso: string): { time: string; date: string } {
  const d = new Date(iso);
  return {
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

export function statusCodeStyle(statusCode: number | null): string {
  if (statusCode === null) return "text-slate-500";
  if (statusCode >= 500) return "text-rose-400 font-medium";
  if (statusCode >= 400) return "text-amber-400 font-medium";
  return "text-pulse font-medium";
}
