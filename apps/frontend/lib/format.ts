import type { Severity } from "@/types/api";

export const severityStyles: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  WARNING: "bg-amber-100 text-amber-800 border-amber-300",
  INFO: "bg-blue-100 text-blue-800 border-blue-300",
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function statusCodeStyle(statusCode: number | null): string {
  if (statusCode === null) return "text-slate-500";
  if (statusCode >= 500) return "text-red-600 font-medium";
  if (statusCode >= 400) return "text-amber-600 font-medium";
  return "text-emerald-600 font-medium";
}
