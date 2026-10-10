"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { MOCK_API_KEYS, MOCK_SCENARIOS, type MockApiKey, type MockScenario } from "@/types/api";

const API_LABELS: Record<MockApiKey, string> = {
  patients: "PatientDataAPI",
  appointments: "AppointmentAPI",
  staff: "StaffAPI",
  billing: "BillingAPI",
};

export function SimulationControls({ onChange }: { onChange?: () => void }) {
  const [pending, setPending] = useState<MockApiKey | null>(null);
  const [selected, setSelected] = useState<Record<MockApiKey, MockScenario>>({
    patients: "NORMAL",
    appointments: "NORMAL",
    staff: "NORMAL",
    billing: "NORMAL",
  });

  async function applyScenario(apiKey: MockApiKey, scenario: MockScenario) {
    setPending(apiKey);
    try {
      await api.setMockScenario(apiKey, scenario);
      setSelected((prev) => ({ ...prev, [apiKey]: scenario }));
      onChange?.();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-pulse" />
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Simulation Controls
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_API_KEYS.map((apiKey) => (
          <div key={apiKey} className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">{API_LABELS[apiKey]}</label>
            <select
              className="rounded-lg border border-line bg-raised px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-pulse/50 disabled:opacity-50"
              value={selected[apiKey]}
              disabled={pending === apiKey}
              onChange={(e) => applyScenario(apiKey, e.target.value as MockScenario)}
            >
              {MOCK_SCENARIOS.map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenario}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
