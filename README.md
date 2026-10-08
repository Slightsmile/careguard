# CareGuard — Intelligent API Monitoring & Alert System

CareGuard is a small API observability/operations platform. It monitors a set of
external APIs (simulated here, since real healthcare APIs are unavailable for this
assessment), deterministically detects anomalies in their behavior, uses an LLM to
explain detected anomalies in plain language, stores the results, and presents them
on a dashboard.

```
Monitor APIs → Detect anomalies → Analyze anomaly → Generate AI alert → Store → Display
```

## Features

- Monitoring engine that checks HTTP status, response time, record counts, and
  response structure for every configured API
- Deterministic anomaly detection (`HIGH_RESPONSE_TIME`, `SERVER_ERROR`, `HTTP_ERROR`,
  `ZERO_RECORDS`, `INVALID_RESPONSE`) — monitoring reliability never depends on the LLM
- Deterministic severity classification (`INFO` / `WARNING` / `CRITICAL`)
- Provider-independent LLM integration (local Qwen / OpenAI / Anthropic / any
  OpenAI-compatible server) that explains anomalies in human-readable alerts
- Graceful fallback to a deterministic alert message if the LLM is unavailable or
  returns malformed output
- Automated scheduled monitoring (configurable interval) plus a manual "Run
  Monitoring" action
- Batch processing of multiple APIs in one request
- Four simulated external APIs with 10 controllable failure scenarios, for demoing
  the system without real upstream dependencies
- PostgreSQL storage via Prisma, with a normalized schema (`MonitoredAPI`,
  `MonitoringCheck`, `Anomaly`, `Alert`)
- REST API covering monitoring, alerts, and API configuration
- Next.js dashboard: overview counts, per-API status table, active alerts table,
  alert detail view, and demo/simulation controls
- Centralized error handling, request validation (zod), rate limiting on
  monitoring endpoints, structured JSON logging
- Unit + integration tests (vitest + supertest)

## Architecture

```
                    ┌─────────────────────┐
                    │   External APIs     │   (simulated: /mock/*)
                    │ Patient / Appointment│
                    │ Staff / Billing      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Monitoring Engine  │   deterministic
                    │ HTTP status         │
                    │ Response time       │
                    │ Data validation     │
                    │ Record count        │
                    └──────────┬──────────┘
                               │
                         Anomaly detected?
                          /            \
                        No              Yes
                        │                │
                        │                ▼
                        │       ┌────────────────┐
                        │       │ LLM Service    │  provider-independent
                        │       │ Qwen/OpenAI/   │  (falls back to a
                        │       │ Claude/compat. │  deterministic message
                        │       └───────┬────────┘  on any failure)
                        │               │
                        └───────┬───────┘
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │ (Prisma)        │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   REST API      │  Express
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Next.js        │
                       │  Dashboard      │
                       └─────────────────┘
```

### Key design decision: deterministic monitoring, AI-assisted explanation

The monitoring/anomaly-detection pipeline never asks the LLM to decide whether
something is broken — that's done by explicit backend rules (status codes, response
time thresholds, record counts, structural validation). The LLM's only job is to turn
an already-detected anomaly into a clear, human-readable explanation (summary,
possible cause, recommended action). Severity is computed by backend rules and passed
to the LLM as a fact, not something the LLM decides. This means the system's core
reliability does not depend on the LLM being available or well-behaved.

See `apps/backend/src/monitoring/rules.ts` for the anomaly rules and
`apps/backend/src/ai/llm.service.ts` for the LLM integration and fallback logic.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript (strict mode), Prisma, PostgreSQL, zod
- **AI**: OpenAI SDK (used for both the OpenAI and OpenAI-compatible/local-Qwen
  providers), Anthropic SDK (dedicated adapter — not assumed to share OpenAI's
  wire format)
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Infra**: Docker Compose (Postgres, backend, frontend)
- **Testing**: vitest, supertest

## System Workflow

1. The scheduler (or a manual "Run Monitoring" click) triggers a check against every
   enabled `MonitoredAPI`.
2. Each API is called over HTTP; status code, response time, and response body are
   captured.
3. The response is structurally validated and anomaly rules are run against the
   result.
4. The check (and any anomalies) are persisted.
5. If anomalies were found, the LLM service is asked to explain them; on success or
   failure, exactly one `Alert` row is created, linked to the highest-severity
   anomaly from that check.
6. The dashboard polls the REST API and reflects current API health and active
   alerts. Alerts can be resolved from the dashboard.

## Folder Structure

```
careguard/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── ai/              # LLMProvider interface, provider adapters, prompt, fallback
│   │   │   ├── jobs/            # scheduler
│   │   │   ├── middleware/      # async handler, error handler, rate limiting
│   │   │   ├── mock-apis/       # simulated external APIs + scenario controls
│   │   │   ├── monitoring/      # anomaly rules, response validation, engine
│   │   │   ├── routes/          # Express routers
│   │   │   ├── services/        # alert persistence/orchestration
│   │   │   ├── utils/           # config, logger, prisma client
│   │   │   ├── app.ts           # Express app (exported for tests)
│   │   │   └── server.ts        # starts the HTTP server + scheduler
│   │   └── prisma/              # schema, migrations, seed script
│   └── frontend/
│       ├── app/                 # Next.js routes (dashboard, alert detail)
│       ├── components/          # dashboard UI components
│       ├── lib/                 # API client, formatting helpers
│       └── types/                # shared TS types mirroring backend responses
├── docs/
│   ├── architecture.md
│   └── AI_Prompts.md
├── docker-compose.yml
├── .env.example
└── package.json                 # npm workspaces root
```

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop (for Postgres, or run Postgres yourself)
- (Optional) A local OpenAI-compatible LLM server (e.g. LM Studio / Bionic running
  Qwen) if you want real AI-generated alerts instead of the deterministic fallback

## Environment Variables

Copy `.env.example` to `.env` (or `apps/backend/.env` for local dev) and adjust:

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://careguard:careguard@localhost:5432/careguard

LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=local
LLM_MODEL=qwen/qwen3.5-9b

MONITOR_INTERVAL_MS=60000

FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Never commit a real `.env` with production secrets.

## Installation

```bash
npm install
```

This installs both `apps/backend` and `apps/frontend` via npm workspaces.

## Database Setup

```bash
# Start Postgres (via Docker)
docker compose up -d postgres

cd apps/backend
npx prisma migrate dev --name init
npm run prisma:seed   # seeds the 4 MonitoredAPI rows pointing at the mock endpoints
```

## Running Locally

```bash
# Terminal 1 — backend (http://localhost:4000)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:3000)
npm run dev:frontend
```

Open `http://localhost:3000`.

## Running with Docker

```bash
docker compose up -d
```

This starts Postgres, the backend, and the frontend as containers. The backend
still needs its database migrated/seeded once (see above), or run it against the
containerized Postgres from the host before bringing the backend container up.

**Reaching a local LLM server from inside Docker**: `localhost` inside a container
refers to the container itself, not your host machine. `docker-compose.yml` sets
`LLM_BASE_URL` to `http://host.docker.internal:1234/v1` by default for the backend
container (with `extra_hosts: host.docker.internal:host-gateway` so this resolves on
Linux too) — point your local Qwen/Bionic server at port 1234 on the host and it will
be reachable from the containerized backend without any other changes.

## LLM Configuration

CareGuard is provider-independent: the monitoring/business logic only ever calls
`llmService.generateAlert(...)`; which provider actually handles that call is chosen
entirely by `LLM_PROVIDER` at startup (see `apps/backend/src/ai/provider.factory.ts`).

### Local Qwen (default, via an OpenAI-compatible server such as LM Studio/Bionic)

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=local
LLM_MODEL=qwen/qwen3.5-9b
```

### OpenAI

```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

### Anthropic (Claude)

```env
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-5-5
```

If the LLM is unreachable, returns malformed output, or the request fails for any
reason, CareGuard automatically falls back to a deterministic, templated alert
message built from the same monitoring facts — monitoring keeps working either way.

## API Documentation

| Method | Path                     | Purpose                                             |
|--------|--------------------------|------------------------------------------------------|
| GET    | `/health`                | System health: DB, scheduler, LLM provider/model     |
| POST   | `/monitor`                | Batch-submit monitoring results for processing       |
| POST   | `/monitor/run`            | Trigger a live monitoring pass against enabled APIs  |
| GET    | `/monitor/history`        | Recent monitoring checks (with anomalies)            |
| GET    | `/apis`                   | List configured `MonitoredAPI` rows                  |
| GET    | `/apis/:id`               | One API with its recent checks                       |
| GET    | `/alerts`                 | List alerts (optional `?status=ACTIVE\|RESOLVED`)     |
| GET    | `/alerts/:id`             | One alert with full anomaly/check/API context         |
| PATCH  | `/alerts/:id/resolve`     | Mark an alert resolved                                |
| GET    | `/mock/:api`               | Simulated external API (`patients`/`appointments`/`staff`/`billing`) |
| GET    | `/mock/_scenarios`         | List available/current mock scenarios                |
| POST   | `/mock/:api/scenario`     | Set a mock API's current failure scenario             |

`/monitor/run` is rate-limited to 30 requests/minute.

### Example Requests

```bash
# Batch monitoring submission
curl -X POST http://localhost:4000/monitor \
  -H "Content-Type: application/json" \
  -d '[
    {"api_name":"PatientDataAPI","response_time_ms":1200,"status_code":200,"records_returned":50},
    {"api_name":"AppointmentAPI","response_time_ms":5500,"status_code":500,"records_returned":0}
  ]'

# Inject a failure scenario on the mock AppointmentAPI
curl -X POST http://localhost:4000/mock/appointments/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario":"HTTP_500"}'

# Trigger a live monitoring run against all configured/enabled APIs
curl -X POST http://localhost:4000/monitor/run
```

### Example Responses

```json
// POST /monitor
{
  "processed": 2,
  "healthy": 1,
  "anomalies": 1,
  "alerts": [
    { "api": "AppointmentAPI", "anomalies": ["SERVER_ERROR", "HIGH_RESPONSE_TIME", "ZERO_RECORDS"] }
  ]
}
```

```json
// GET /alerts/:id (truncated)
{
  "alert": {
    "severity": "CRITICAL",
    "summary": "AppointmentAPI returned HTTP 500. Response time was 5500ms. 0 records returned.",
    "possibleCause": "Unable to determine — AI analysis unavailable.",
    "recommendedAction": "Investigate the API manually and check service logs.",
    "provider": "fallback",
    "model": "none",
    "status": "ACTIVE"
  }
}
```

## Testing

```bash
cd apps/backend
npm test
```

Covers: anomaly detection rules (all rule combinations + severity escalation), LLM
response parsing/validation, the deterministic fallback builder, and REST endpoint
integration tests for `/monitor` and `/alerts` (validation errors, 404s, happy paths,
end-to-end anomaly-to-alert flow).

## Troubleshooting

- **`/health` reports `database: unreachable`**: Postgres isn't running or
  `DATABASE_URL` is wrong. `docker compose up -d postgres` and check the URL.
- **Alerts always show `provider: fallback`**: the configured LLM isn't reachable.
  If using local Qwen, confirm the server is running at `LLM_BASE_URL` and reachable
  from wherever the backend is running (see the Docker networking note above).
- **CORS errors in the browser**: `FRONTEND_URL` on the backend must match the
  origin the frontend is actually served from.
- **Scheduler never seems to run**: check `/health`'s `scheduler.nextRunAt`, and
  confirm `MONITOR_INTERVAL_MS` is set to what you expect.

## AI Usage

This project was built with AI assistance throughout (code generation, architecture
decisions, and prompt design for the LLM alert service). See
[`docs/AI_Prompts.md`](docs/AI_Prompts.md) for a record of how AI was used during
development, and `apps/backend/src/ai/prompt.ts` for the production system prompt
that drives the application's own LLM-generated alerts.

## Future Improvements

- Email notifications on new critical alerts (optional per the assessment; not
  implemented here to keep scope focused on the core requirements)
- `POST /apis` / `PATCH /apis/:id` for managing monitored APIs from the dashboard,
  with URL validation to prevent pointing the monitor at arbitrary internal
  addresses
- Per-API alert history/trends view
- WebSocket or SSE push instead of dashboard polling
- Multi-tenant / auth support if this moved beyond a single-team internal tool
