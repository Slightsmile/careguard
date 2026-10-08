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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Demo / Simulation Controls</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_API_KEYS.map((apiKey) => (
          <div key={apiKey} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">{API_LABELS[apiKey]}</label>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
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
