# AI Prompts — Development Log

This project was built with Claude (Anthropic) as the coding agent for the entire
implementation: architecture decisions, all source code, tests, and documentation.
This log records how AI was used, per the assessment's requirement to document AI
prompts used for code generation, prompt design, and logic building. Nothing in this
project was built without AI assistance, and this document does not claim otherwise.

The log is split into two parts:

1. **Prompts used to build the project** (you → Claude, across the development
   session)
2. **The prompt built into the product itself** (the system prompt CareGuard sends
   to whichever LLM provider is configured, to generate alert explanations at
   runtime)

---

## 1. Prompts used to build the project

Development proceeded phase by phase, following the plan laid out in the master
project brief. Each phase below was a single instruction from the user; Claude
designed and implemented the corresponding code, ran builds/tests, and verified
behavior live before moving on.

| # | Prompt | Purpose | How it was used | Outcome / impact |
|---|--------|---------|------------------|-------------------|
| 1 | *(Full master prompt — project brief)* "Analyze the Master Prompt... we will build phase by phase. start with phase 1." | Establish the complete product spec (CareGuard: monitoring, anomaly detection, AI alerts, dashboard, DB, REST API, batch processing, logging, provider-independent LLM architecture) and kick off incremental implementation | Read in full and used as the specification for every subsequent phase; re-referenced throughout to check scope and section numbers | Drove the entire 7-phase build plan and every architectural decision below |
| 2 | "phase 1" | Build the foundation: monorepo, backend (Express/TS/strict), frontend (Next.js/TS/Tailwind), PostgreSQL + Prisma, Docker Compose, env config | Implemented workspace structure, `tsconfig`, Prisma schema (`MonitoredAPI`, `MonitoringCheck`, `Anomaly`, `Alert`), `/health` endpoint, Docker Compose services | Verified: backend built and connected to Postgres, migration applied, frontend built; `/health` returned `database: healthy` |
| 3 | "phase 2" | Build monitoring: mock APIs with controllable failure scenarios, the deterministic monitoring engine, anomaly rules, `POST /monitor` | Implemented `src/mock-apis/`, `src/monitoring/rules.ts` (deterministic anomaly detection), `monitoring.engine.ts`, `live-check.ts`, `POST /monitor` and `/monitor/run` | Verified live: injected `HTTP_500` on the mock AppointmentAPI, confirmed `SERVER_ERROR` + `HIGH_RESPONSE_TIME` detected and persisted; 11 unit tests on the rules |
| 4 | "phase 3" | Build the AI layer: provider-independent `LLMProvider` interface, local Qwen (OpenAI-compatible), OpenAI, and Anthropic adapters, structured prompt/output, fallback on failure | Designed `LLMProvider` interface, wrote the production system prompt (see part 2 below), implemented three provider adapters + factory + `llm.service.ts` with zod-validated output and a deterministic fallback | Verified live (with no local LLM server running) that an anomaly correctly fell back to a deterministic alert message instead of failing the request; confirmed severity always comes from backend rules, never the LLM |
| 5 | "phase 4" | Build the dashboard: overview, API table, alerts table, alert detail, monitoring history, demo controls | Implemented the Next.js dashboard (`OverviewCards`, `ApiStatusTable`, `AlertsTable`, `SimulationControls`, alert detail page), a typed API client | Verified builds cleanly (type-checked) and that the dashboard's REST calls return the exact shapes the components expect, via direct endpoint testing |
| 6 | "phase 5" | Add automated scheduled monitoring, configurable via `MONITOR_INTERVAL_MS`, alongside the existing manual run | Extracted `runEnabledApis()` as shared logic; added a `setInterval`-based scheduler with status tracking exposed via `/health`; removed the unused `node-cron` dependency (chose `setInterval` since the config is a raw ms interval, not a cron expression) | Verified live: started the server with a 5s interval, confirmed checks and an alert were created with zero manual triggers |
| 7 | "phase 6" | Harden the system: centralized error handling, rate limiting, expanded tests, security review | Added `asyncHandler`/`errorHandler`/`notFoundHandler` middleware, `express-rate-limit` on `/monitor*`, split `app.ts`/`server.ts` for testability, wrote 12 supertest integration tests, audited for secret logging | Verified live: 404s work, rate limiter trips after 30 req/min, malformed JSON returns 400 without crashing the server; 29/29 tests passing |
| 8 | "phase 7" | Produce submission artifacts: README, architecture docs, this AI-usage log, final assessment-alignment check | This document, `README.md`, `docs/architecture.md`, and the checklist below | — |

A few points worth being explicit about, since they're exactly what this kind of
log is meant to surface:

- **No code in this repository was hand-written without AI assistance.** Claude
  wrote every source file, test, and config. The user's role was specifying what
  to build (via the master prompt and phase-by-phase instructions) and making a
  small number of explicit design decisions when asked (see below).
- **Claude asked the user to decide**, rather than guessing, on points with real
  tradeoffs: how to map anomalies to alerts when a check can produce multiple
  anomaly types (one alert per check vs. one per anomaly — user chose "one per
  check"), what to do when Docker Desktop wasn't running during verification steps
  (user chose to start it rather than skip verification), and which scheduling
  mechanism to use for the automated monitoring job (user chose `setInterval` over
  forcing `node-cron` into a non-cron use case).
- **Every phase was followed by actual verification** — builds, type checks, unit
  tests, and live HTTP requests against a running backend/Postgres — not just
  code generation. Results reported to the user (test counts, live request/response
  pairs) reflect what was actually observed, not assumed.

---

## 2. The prompt built into the product

This is the system prompt CareGuard itself sends to the configured LLM provider at
runtime, to turn a deterministically-detected anomaly into a human-readable alert.
It lives in [`apps/backend/src/ai/prompt.ts`](../apps/backend/src/ai/prompt.ts) and
is provider-agnostic — the same prompt is used regardless of whether the configured
provider is local Qwen, OpenAI, or Anthropic.

```text
You are an API monitoring assistant for a healthcare operations platform.

You will be given structured, factual monitoring data describing an anomaly that was already detected by deterministic backend rules. Your job is ONLY to explain it to a human operator.

Rules:
- Be concise and professional.
- Do not invent facts. Only reason from the supplied monitoring data.
- Clearly distinguish between facts (what was observed) and possible causes (your inference).
- Do not re-classify severity; treat the provided severity as authoritative.
- Recommend a practical, specific next step an operator could take.
- Respond with ONLY a JSON object, no markdown, no commentary, matching exactly this shape:

{
  "summary": "one or two sentence plain-language summary of what happened",
  "possible_cause": "one or two sentence plausible cause, clearly framed as a hypothesis",
  "recommended_action": "one concise, practical next step"
}
```

**Design rationale:**

- *"already detected by deterministic backend rules... Your job is ONLY to
  explain it"* — explicitly prevents the model from re-diagnosing or
  second-guessing whether something is actually wrong. This mirrors the master
  prompt's requirement that monitoring reliability not depend on the LLM (section
  4 of the project brief).
- *"Do not re-classify severity; treat the provided severity as authoritative"* —
  the backend computes severity (`computeOverallSeverity` in `rules.ts`) and passes
  it to the model as a given fact. The model may explain why something is CRITICAL
  but cannot override the classification, matching the brief's requirement that
  "the fundamental severity classification should be determined by backend rules."
- *"Only reason from the supplied monitoring data" / "Do not invent facts"* —
  the model receives a minimal `AlertContext` (API name, status code, response
  time, record count, anomaly types, severity) and nothing else, so there's no
  surface area for it to hallucinate about systems or data it was never shown.
- *Structured JSON output* — enables `parseLLMResponse()` to validate the result
  against a zod schema before it's trusted. If the model wraps the JSON in markdown
  fences, that's stripped; if it returns something that doesn't parse or is missing
  a required field, the call is treated as failed and the system falls back to a
  deterministic message (`buildFallbackAlert()`), per the brief's requirement to
  "gracefully fall back to a deterministic alert message" if LLM output can't be
  validated.

---

## 3. Assessment alignment (final check)

Verified against the master prompt's own checklist (section 38):

- [x] Automatically monitors API responses — scheduler, Phase 5
- [x] Detects anomalies — `rules.ts`, deterministic
- [x] High response time detection — `HIGH_RESPONSE_TIME`
- [x] HTTP failure detection — `SERVER_ERROR` / `HTTP_ERROR`
- [x] Zero/missing records detection — `ZERO_RECORDS` / `INVALID_RESPONSE`
- [x] AI-generated human-readable alerts — `llm.service.ts`, three providers
- [x] Database storage — PostgreSQL via Prisma
- [x] `GET /alerts` — implemented, with status filtering
- [x] Clean frontend — Next.js dashboard, Phase 4
- [x] Node.js — yes
- [x] Express — yes
- [x] Modular architecture — ai/jobs/middleware/mock-apis/monitoring/routes/services/utils
- [x] LLM integration — provider-independent, 3 adapters + fallback
- [x] Batch processing — `POST /monitor` accepts arrays; engine processes in batch
- [x] Error handling — centralized middleware, async wrapper, graceful LLM fallback
- [x] Logging — structured JSON logs, INFO/WARN/ERROR/DEBUG levels, no secrets logged
- [x] README — this repository's `README.md`
- [ ] GitHub repository — not yet pushed; this is a local repository at the time of
      writing
- [ ] 5–10 minute explanation video — not recorded as part of this session
- [x] `AI_Prompts.docx` — this file (`AI_Prompts.md`) is the source; convert to
      `.docx` for final submission per the brief's format requirement
