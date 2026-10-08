import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  monitorIntervalMs: Number(process.env.MONITOR_INTERVAL_MS ?? 60000),
  backendBaseUrl: process.env.BACKEND_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  monitoring: {
    defaultResponseTimeThresholdMs: Number(process.env.RESPONSE_TIME_THRESHOLD_MS ?? 3000),
    serverErrorStatusCode: 500,
    clientErrorStatusCode: 400,
  },
  llm: {
    provider: process.env.LLM_PROVIDER ?? "openai-compatible",
    baseUrl: process.env.LLM_BASE_URL ?? "http://localhost:1234/v1",
    apiKey: process.env.LLM_API_KEY ?? "local",
    model: process.env.LLM_MODEL ?? "qwen/qwen3.5-9b",
  },
};
