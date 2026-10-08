import { Router } from "express";
import { z } from "zod";
import {
  getAllScenarios,
  getScenario,
  setScenario,
  MOCK_API_KEYS,
  MOCK_SCENARIOS,
  type MockApiKey,
  type MockScenario,
} from "./scenarios";
import { generateMockResponse } from "./response-generator";
import { logger } from "../utils/logger";

export const mockApisRouter = Router();

const API_NAMES: Record<MockApiKey, string> = {
  patients: "PatientDataAPI",
  appointments: "AppointmentAPI",
  staff: "StaffAPI",
  billing: "BillingAPI",
};

function registerMockEndpoint(key: MockApiKey) {
  mockApisRouter.get(`/mock/${key}`, async (_req, res) => {
    const scenario = getScenario(key);
    const apiName = API_NAMES[key];
    const { statusCode, delayMs, body } = generateMockResponse(apiName, scenario);

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    logger.debug("Mock API request served", { api: apiName, scenario, statusCode, delayMs });
    res.status(statusCode).json(body);
  });
}

MOCK_API_KEYS.forEach(registerMockEndpoint);

// --- Simulation controls ---

mockApisRouter.get("/mock/_scenarios", (_req, res) => {
  res.json({ available: MOCK_SCENARIOS, current: getAllScenarios() });
});

const setScenarioSchema = z.object({
  scenario: z.enum(MOCK_SCENARIOS as [string, ...string[]]),
});

mockApisRouter.post(`/mock/:api/scenario`, (req, res) => {
  const apiKey = req.params.api as MockApiKey;

  if (!MOCK_API_KEYS.includes(apiKey)) {
    res.status(404).json({ error: `Unknown mock API: ${req.params.api}` });
    return;
  }

  const parsed = setScenarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid scenario", details: parsed.error.flatten() });
    return;
  }

  setScenario(apiKey, parsed.data.scenario as MockScenario);
  logger.info("Mock API scenario changed", { api: apiKey, scenario: parsed.data.scenario });
  res.json({ api: apiKey, scenario: parsed.data.scenario });
});
