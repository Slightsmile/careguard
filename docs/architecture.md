# CareGuard Architecture

## Goals

CareGuard exists to answer one question reliably: **is this API behaving normally,
and if not, what probably happened and what should an operator do about it?**

Two things follow from that:

1. The "is it behaving normally" part must be deterministic. An LLM should never be
   in the critical path of deciding whether a 500 is bad or whether zero records is
   a problem — those are facts, not judgment calls.
2. The "what probably happened" part is exactly where an LLM adds value: turning a
   list of anomaly codes into something a human can read in two seconds. And because
   that part is inherently best-effort (the LLM might be down, slow, or return
   garbage), the system must keep working — with a lower-quality but correct
   message — when it fails.

Those two points drove most of the structural decisions below.

## Request/data flow

```
MonitoredAPI (config: name, url, method, threshold)
        │
        ▼
runEnabledApis() ──► runLiveCheck() ──► HTTP request to the target API
        │                                (measures status code, response time)
        ▼
processBatch() / processCheckResult()
        │
        ├─► validateApiResponse()      structural check: does body.records exist & is it an array?
        ├─► detectAnomalies()          pure function: (status, time, records, threshold) → Anomaly[]
        ├─► computeOverallSeverity()   pure function: Anomaly[] → INFO | WARNING | CRITICAL
        │
        ├─► persist MonitoringCheck
        ├─► persist Anomaly rows (one per detected type)
        │
        └─► if anomalies.length > 0:
                handleAnomalies() ──► llmService.generateAlert(AlertContext)
                                           │
                                           ├─ success → AlertResult from provider
                                           └─ failure → buildFallbackAlert() (deterministic)
                                      │
                                      └─► persist one Alert, linked to the
                                          highest-severity Anomaly from this check
```

Two entry points feed `processBatch`:

- `POST /monitor` — accepts pre-collected monitoring data directly (useful for
  batch ingestion from an external collector, and for testing without live HTTP calls)
- `runEnabledApis()` — actually calls the configured APIs over HTTP; used by both
  `POST /monitor/run` (manual) and the scheduler (automatic)

Both converge on the same `processBatch`/`processCheckResult` logic, so there is
exactly one place anomaly detection and persistence happen.

## Why one Alert per check, not one per anomaly

A single bad check can trigger several anomaly types at once (e.g. `SERVER_ERROR` +
`HIGH_RESPONSE_TIME` + `ZERO_RECORDS` all from one HTTP 500). The schema allows one
`Alert` per `Anomaly` (`Alert.anomalyId` is unique), but generating three separate
LLM-written alerts for what is operationally one incident would be noisy and
wasteful. Instead, all anomaly types from a check are passed into the LLM context
together, one alert is generated, and it's linked to whichever anomaly row is
highest severity (ties broken by order detected). The individual `Anomaly` rows are
still persisted separately, so the fine-grained history (what exact rule fired) is
not lost — only the player-facing alert is consolidated.

## Provider-independent LLM layer

```
business logic
      │
      ▼
llmService.generateAlert(context: AlertContext)
      │
      ├─ provider.generateAlert(context)   ← the only provider-specific call
      │      │
      │      ├─ OpenAICompatibleProvider   (OpenAI SDK, configurable baseURL — local Qwen by default)
      │      ├─ OpenAIProvider             (OpenAICompatibleProvider pinned to api.openai.com)
      │      └─ AnthropicProvider          (separate SDK — Claude's API shape differs from OpenAI's)
      │
      └─ on any failure (network, timeout, malformed JSON, schema mismatch):
             buildFallbackAlert(context)   ← deterministic, template-based
```

`provider.factory.ts` reads `LLM_PROVIDER` once at startup and constructs the
matching adapter. Nothing outside `src/ai/` knows which provider is active — the
monitoring engine and alert service only ever call `generateAlert()`.

`OpenAIProvider` is implemented as a thin subclass of `OpenAICompatibleProvider`
because they are mechanically identical (same SDK, same request/response shape,
only the base URL differs). `AnthropicProvider` is a separate implementation,
deliberately not sharing code with the OpenAI path, because the Messages API has a
different request shape and response envelope — assuming otherwise is a common and
subtle bug.

All three providers are asked to return structured JSON (`summary`,
`possible_cause`, `recommended_action`) and that output is validated against a zod
schema (`response-schema.ts`) before being trusted. A model that wraps its JSON in
markdown fences is handled; a model that returns prose instead of JSON, or omits a
required field, causes validation to throw — which `llm.service.ts` catches and
treats exactly like a network failure, falling back to the deterministic message.
Severity is never taken from the LLM; it's attached by the caller from the
backend-computed value and the LLM is simply told what it is.

## Why `setInterval` instead of `node-cron` for the scheduler

`MONITOR_INTERVAL_MS` is a plain millisecond interval (`60000`, etc.), not a cron
expression. `node-cron` is built for calendar-style schedules ("every day at 3am");
forcing a fixed repeating interval through cron syntax (`*/60 * * * * *`) adds
translation complexity for no benefit and breaks down for intervals that aren't
whole seconds/minutes. A plain `setInterval` matches the configuration's actual
semantics and was simpler to implement and test, so `node-cron` was removed as a
dependency rather than kept unused.

## Error handling

`app.ts` builds and exports the Express app (unstarted) so it can be driven directly
by supertest in integration tests; `server.ts` is the only thing that calls
`.listen()` and starts the scheduler. Every async route handler is wrapped in
`asyncHandler`, which forwards rejected promises to Express's `next()` instead of
letting them crash the process or hang the request. A final `errorHandler`
middleware logs the error (message only, never a raw stack trace or request body)
and returns a generic `500`, except for JSON body-parse errors, which get a `400`.
An unmatched route returns `404` via `notFoundHandler`. The practical effect: a bug
in one request can't take down the whole server or silently hang a client.

## Data model

```
MonitoredAPI 1──* MonitoringCheck 1──* Anomaly 1──1 Alert
```

- `MonitoredAPI` — the configured target (name, URL, method, enabled flag,
  per-API response-time threshold)
- `MonitoringCheck` — one HTTP probe's raw outcome (status, timing, record count,
  success flag)
- `Anomaly` — one detected rule violation for a check (type, severity, details)
- `Alert` — the (at most one) LLM-or-fallback-generated explanation for a check,
  linked to its primary `Anomaly`

Thresholds live on `MonitoredAPI.responseTimeThreshold` (per-API override) with a
global default in `config.monitoring.defaultResponseTimeThresholdMs` — not
hard-coded inline in the rules themselves.

## Mock APIs

Because real patient/operational APIs aren't available for this assessment, four
mock endpoints (`/mock/patients`, `/mock/appointments`, `/mock/staff`,
`/mock/billing`) simulate them. Each has an in-memory "current scenario" (default
`NORMAL`) that can be changed via `POST /mock/:api/scenario`, driving the
dashboard's demo controls. Scenarios cover the full matrix the assessment asks for:
normal, slow, 400/401/404/500, zero records, missing fields, invalid data, and
random intermittent failure (which picks one of the other failure modes at random
per request, to simulate a flaky upstream).
