# MASTER PROMPT — Intelligent API Monitoring & Alert System

You are a senior full-stack/AI engineer helping me build a production-quality technical assessment project for an **AI/Automation Engineer** position.

Your job is to design and implement the complete system described below. Do not jump directly into writing large amounts of code. First understand the requirements, establish the architecture, then implement the system incrementally with clean, maintainable code.

---

# 1. PROJECT CONTEXT

The assessment is for an AI/Automation Engineer role.

The company works with multiple external APIs containing patient and operational data. These APIs may:

- Fail intermittently
- Return inconsistent data
- Produce abnormal responses

The system must proactively monitor these APIs, detect anomalies, and generate intelligent human-readable alerts.

The assessment explicitly requires:

- API health monitoring
- Anomaly detection
- AI-powered alert generation
- Database storage
- REST API
- Frontend dashboard
- Batch processing
- Error handling
- Logging
- Modular/scalable architecture

The required backend technology is **Node.js**, with **Express recommended**.

---

# 2. CORE PRODUCT

Build a complete application called:

**CareGuard — Intelligent API Monitoring & Alert System**

The application should behave like a small real-world API observability/operations platform.

It should monitor multiple external APIs, detect abnormal behavior, use an LLM to explain the detected problems, store alerts, and present them through a clean dashboard.

This should NOT be a generic CRUD application.

The primary purpose is:

```text
Monitor APIs
    ↓
Detect anomalies
    ↓
Analyze anomaly
    ↓
Generate human-readable AI alert
    ↓
Store alert
    ↓
Display alert on dashboard
```

---

# 3. HIGH-LEVEL ARCHITECTURE

Use this conceptual architecture:

```text
                    ┌─────────────────────┐
                    │   External APIs     │
                    │                     │
                    │ Patient API         │
                    │ Appointment API     │
                    │ Staff API           │
                    │ Billing API         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Monitoring Engine  │
                    │                     │
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
                        │       │ LLM Service    │
                        │       │                │
                        │       │ Qwen/OpenAI/   │
                        │       │ Claude/etc.    │
                        │       └───────┬────────┘
                        │               │
                        └───────┬───────┘
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ API checks      │
                       │ Anomalies       │
                       │ Alerts          │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   REST API      │
                       │                 │
                       │ /monitor        │
                       │ /alerts         │
                       │ /apis           │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    Dashboard    │
                       │                 │
                       │ API health      │
                       │ Active alerts   │
                       │ History         │
                       └─────────────────┘
```

---

# 4. IMPORTANT DESIGN PRINCIPLE

The monitoring engine must remain deterministic.

DO NOT ask the LLM to determine basic facts such as:

- Whether HTTP 500 is an error
- Whether 0 records were returned
- Whether response time exceeds a threshold

The backend should detect those conditions itself.

The LLM is responsible for:

- Explaining the detected anomaly
- Creating a human-readable alert
- Summarizing possible operational impact
- Providing a reasonable recommended action

Correct architecture:

```text
Deterministic monitoring
        ↓
Anomaly detection
        ↓
LLM interpretation
        ↓
Human-readable alert
```

NOT:

```text
API response
    ↓
LLM
    ↓
"Maybe something is wrong"
```

Reliability of the monitoring system must not depend on the LLM.

---

# 5. MOCK EXTERNAL APIS

Because real healthcare APIs are unavailable for the assessment, create simulated external APIs.

Create several mock APIs that behave like external services:

```text
GET /mock/patients
GET /mock/appointments
GET /mock/staff
GET /mock/billing
```

These should simulate realistic API responses.

Example healthy response:

```json
{
  "api_name": "PatientDataAPI",
  "status_code": 200,
  "response_time_ms": 120,
  "records_returned": 50
}
```

Example failure:

```json
{
  "api_name": "AppointmentAPI",
  "status_code": 500,
  "response_time_ms": 5500,
  "records_returned": 0
}
```

The mock APIs should support controlled failure scenarios for demonstration.

Possible scenarios:

- Normal response
- Slow response
- HTTP 400
- HTTP 401
- HTTP 404
- HTTP 500
- Zero records
- Missing fields
- Invalid data
- Random intermittent failure

The purpose is to make the demonstration realistic.

---

# 6. MONITORING ENGINE

Implement a reusable monitoring engine.

For every monitored API:

1. Send HTTP request.
2. Measure response time.
3. Capture HTTP status.
4. Validate response structure.
5. Determine record count where applicable.
6. Compare metrics against configured thresholds.
7. Generate anomaly objects.
8. If anomalies exist, send structured context to the LLM service.
9. Store the resulting alert.
10. Log the monitoring operation.

The monitoring engine must support batch processing of multiple APIs.

---

# 7. ANOMALY RULES

Implement deterministic rules.

At minimum:

### High response time

Example:

```text
response_time_ms > 3000
```

Generate:

```text
HIGH_RESPONSE_TIME
```

### HTTP failure

Example:

```text
status_code >= 500
```

Generate:

```text
SERVER_ERROR
```

### Client error

Example:

```text
status_code >= 400
```

Generate:

```text
HTTP_ERROR
```

### Zero records

```text
records_returned === 0
```

Generate:

```text
ZERO_RECORDS
```

### Missing/invalid data

Generate:

```text
INVALID_RESPONSE
```

Thresholds must be configurable rather than hard-coded throughout the application.

---

# 8. ALERT SEVERITY

Implement deterministic severity rules.

Example:

```text
CRITICAL
- HTTP 500+
- Multiple severe anomalies
- 500 + zero records
- API completely unavailable

WARNING
- High response time
- Zero records
- 4xx errors
- Data validation issues

INFO
- Minor deviations
```

The LLM may explain the severity, but the fundamental severity classification should be determined by backend rules.

---

# 9. PROVIDER-INDEPENDENT LLM ARCHITECTURE

This is an important architectural requirement.

Do NOT hard-code the application to OpenAI.

The system must support multiple LLM providers through a common abstraction.

At minimum, design for:

```text
Local Qwen
OpenAI
Anthropic Claude
OpenAI-compatible APIs
```

The monitoring/business logic must not know which LLM provider is being used.

Use an interface similar to:

```typescript
interface LLMProvider {
  generateAlert(
    context: AlertContext
  ): Promise<AlertResult>;
}
```

Then implement provider adapters:

```text
LLMProvider
    │
    ├── OpenAIProvider
    ├── AnthropicProvider
    └── OpenAICompatibleProvider
```

Use a provider factory/service:

```text
LLMService
    ↓
ProviderFactory
    ↓
Selected provider
```

The rest of the application should only communicate with:

```typescript
llmService.generateAlert(...)
```

---

# 10. LOCAL QWEN CONFIGURATION

I already have a local LLM server running through Bionic.

Current configuration:

```text
Base URL:
http://localhost:1234/v1

Model:
qwen/qwen3.5-9b
```

This is an OpenAI-compatible API.

Use the OpenAI Node SDK for the OpenAI-compatible implementation where appropriate.

Example configuration:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=local
LLM_MODEL=qwen/qwen3.5-9b
```

The local model should be the default development/demo provider.

Do not expose the local LLM endpoint to the frontend.

The browser communicates only with our backend.

---

# 11. OPENAI SUPPORT

Support OpenAI through configuration.

Example:

```env
LLM_PROVIDER=openai
LLM_API_KEY=...
LLM_MODEL=...
```

API credentials must remain server-side.

Never expose API keys to the frontend.

---

# 12. ANTHROPIC / CLAUDE SUPPORT

Support Anthropic through a dedicated adapter rather than assuming Claude is identical to OpenAI.

Example:

```env
LLM_PROVIDER=anthropic
LLM_API_KEY=...
LLM_MODEL=...
```

The rest of the system must not need to change when switching providers.

---

# 13. OPENAI-COMPATIBLE PROVIDER

Create a generic provider for APIs implementing the OpenAI-compatible interface.

This allows support for:

- Local Qwen
- LM Studio/Bionic-style servers
- Other OpenAI-compatible servers

Configuration:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=local
LLM_MODEL=qwen/qwen3.5-9b
```

---

# 14. LLM INPUT

Never send arbitrary raw application data unnecessarily.

Create a structured `AlertContext`.

Example:

```json
{
  "api_name": "AppointmentAPI",
  "status_code": 500,
  "response_time_ms": 5500,
  "records_returned": 0,
  "anomalies": [
    "SERVER_ERROR",
    "HIGH_RESPONSE_TIME",
    "ZERO_RECORDS"
  ]
}
```

The LLM should receive only the information needed to explain the anomaly.

---

# 15. LLM PROMPT

Create a robust system prompt.

The model should:

- Be concise
- Be professional
- Not invent facts
- Only reason from supplied monitoring data
- Explain likely operational impact carefully
- Clearly distinguish facts from possible causes
- Recommend practical next steps

Expected output structure:

```json
{
  "summary": "...",
  "severity": "CRITICAL",
  "possible_cause": "...",
  "recommended_action": "..."
}
```

Prefer structured JSON output where supported.

Validate the LLM response before storing it.

If parsing fails, gracefully fall back to a deterministic alert message.

---

# 16. LLM FAILURE HANDLING

The monitoring system must continue working if the LLM is unavailable.

Example:

```text
Anomaly detected
       ↓
Try LLM
       ↓
 ┌─────┴─────┐
Success     Failure
   ↓           ↓
AI alert    Fallback alert
   └─────┬─────┘
         ↓
      Database
```

Fallback example:

```text
AppointmentAPI returned HTTP 500.
Response time was 5500ms and zero records were returned.
```

The system should log LLM failures.

---

# 17. DATABASE

Use PostgreSQL.

Prisma is preferred unless there is a strong reason to use another ORM.

Design normalized, maintainable models.

At minimum consider:

### MonitoredAPI

```text
id
name
url
method
enabled
threshold configuration
createdAt
updatedAt
```

### MonitoringCheck

```text
id
apiId
statusCode
responseTimeMs
recordsReturned
success
checkedAt
errorMessage
```

### Anomaly

```text
id
monitoringCheckId
type
severity
details
createdAt
resolvedAt
```

### Alert

```text
id
anomalyId
title
summary
possibleCause
recommendedAction
severity
provider
model
status
createdAt
resolvedAt
```

Adjust the schema if a better normalized design is appropriate.

---

# 18. REST API

Implement at minimum:

```text
POST /monitor
GET /alerts
```

`POST /monitor` should accept batch API monitoring data.

Also implement useful endpoints such as:

```text
GET /apis
GET /apis/:id
GET /alerts/:id
PATCH /alerts/:id/resolve
GET /monitor/history
POST /monitor/run
GET /health
```

Do not add endpoints purely for quantity. Every endpoint should have a clear purpose.

---

# 19. POST /monitor

Support a payload similar to:

```json
[
  {
    "api_name": "PatientDataAPI",
    "response_time_ms": 1200,
    "status_code": 200,
    "records_returned": 50
  },
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  }
]
```

The endpoint should:

1. Validate input.
2. Process all records.
3. Detect anomalies.
4. Generate AI explanations for anomalous records.
5. Store monitoring results.
6. Return a useful summary.

Example response:

```json
{
  "processed": 2,
  "healthy": 1,
  "anomalies": 1,
  "alerts": [...]
}
```

---

# 20. AUTOMATED MONITORING

Add scheduled monitoring.

For example:

```text
Every 1 minute
      ↓
Fetch configured APIs
      ↓
Run monitoring engine
      ↓
Store results
      ↓
Generate alerts
```

The scheduler interval must be configurable.

Do not make the application dependent on manual clicking.

However, retain a manual "Run Monitoring" action for demonstrations.

---

# 21. FRONTEND

Build a clean professional dashboard.

Recommended stack:

```text
Next.js
TypeScript
Tailwind CSS
```

Dashboard should show:

### Overview

```text
Total APIs
Healthy APIs
Warning APIs
Critical APIs
Active Alerts
```

### API status table

Columns:

```text
API
Status
HTTP
Response Time
Records
Last Checked
```

### Active alerts

Display:

```text
API
Severity
Alert
Possible Cause
Recommended Action
Time
Status
```

Use clear visual hierarchy.

---

# 22. ALERT DETAILS

When clicking an alert, show:

```text
AppointmentAPI

CRITICAL

HTTP Status:
500

Response Time:
5,500 ms

Records:
0

Detected anomalies:
- SERVER_ERROR
- HIGH_RESPONSE_TIME
- ZERO_RECORDS

AI Summary:
...

Possible Cause:
...

Recommended Action:
...

LLM Provider:
Local Qwen

Model:
qwen/qwen3.5-9b

Detected:
...
```

This makes the AI integration visible during the demo.

---

# 23. API MANAGEMENT

Allow the dashboard to display configured APIs.

If reasonable within scope, allow:

```text
Add API
Edit API
Enable/Disable API
Test API
Run monitoring
```

Do not allow arbitrary dangerous URLs without appropriate validation.

---

# 24. DEMO / SIMULATION CONTROLS

Make the mock API system easy to demonstrate.

Provide controls such as:

```text
Appointment API

Normal
Slow
500 Error
Zero Records
Invalid Data
```

Then demonstrate:

```text
Normal
   ↓
Healthy

Enable 500 Error
   ↓
Run monitoring
   ↓
Anomaly detected
   ↓
Qwen analyzes
   ↓
Critical alert appears
```

This should be one of the main video demonstrations.

---

# 25. EMAIL — OPTIONAL

Email alerts are optional in the assessment.

Only implement this after the core system is complete.

If implemented:

```text
Anomaly detected
     ↓
Alert generated
     ↓
Email notification
```

Make email configuration environment-based.

Do not let email failures break monitoring.

---

# 26. LOGGING

Implement structured application logging.

Log:

- Monitoring start/end
- API requests
- Response time
- Detected anomalies
- LLM provider/model
- LLM failures
- Database failures
- Scheduler execution
- Unexpected errors

Never log:

- API keys
- Secrets
- Passwords
- Sensitive patient information

Use appropriate log levels:

```text
INFO
WARN
ERROR
DEBUG
```

---

# 27. SECURITY

Implement basic security practices:

- Environment variables for secrets
- Input validation
- API key protection
- No frontend exposure of secrets
- Proper error responses
- Avoid logging sensitive data
- Validate URLs where external API monitoring is configurable
- Avoid arbitrary internal network access where possible
- CORS configuration
- Rate limiting where appropriate

Do not over-engineer security beyond the assessment scope.

---

# 28. PROJECT STRUCTURE

Use a clean monorepo structure.

Suggested:

```text
careguard/
│
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── jobs/
│   │   │   ├── ai/
│   │   │   │   ├── providers/
│   │   │   │   ├── llm.service.ts
│   │   │   │   └── provider.factory.ts
│   │   │   ├── monitoring/
│   │   │   ├── mock-apis/
│   │   │   ├── utils/
│   │   │   └── app.ts
│   │   │
│   │   └── prisma/
│   │
│   └── frontend/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── types/
│
├── docs/
│   ├── architecture.md
│   └── AI_Prompts.md
│
├── docker-compose.yml
├── README.md
├── .env.example
└── package.json
```

You may improve this structure if you have a better justified design.

---

# 29. DOCKER

Use Docker Compose for local infrastructure.

At minimum consider:

```text
backend
frontend
postgres
```

The local Qwen/Bionic service can remain on the host machine if necessary.

Document clearly how the containerized backend accesses the host's local LLM endpoint.

Do not assume `localhost` inside Docker refers to the host.

Provide the correct configuration mechanism for the development environment.

---

# 30. TESTING

Implement meaningful tests.

At minimum test:

### Anomaly detection

```text
500 → anomaly
200 + slow → anomaly
200 + zero records → anomaly
200 + normal response → healthy
```

### API validation

Invalid input should return proper errors.

### Alert generation

Test successful LLM response.

Test LLM failure and fallback.

### REST endpoints

Test:

```text
POST /monitor
GET /alerts
```

Do not aim for artificial 100% coverage. Prioritize important business logic.

---

# 31. HEALTH CHECK

Provide:

```text
GET /health
```

It should indicate basic system health.

Optionally report:

```text
Database: healthy
LLM: available
Scheduler: running
```

Do not expose sensitive configuration.

---

# 32. OBSERVABILITY

Include enough information to understand system behavior.

Useful dashboard information:

```text
Last monitoring run
Next monitoring run
Total checks
Failed checks
Active alerts
LLM provider
LLM model
```

---

# 33. AI PROMPT DOCUMENTATION

The assessment explicitly requires documentation of AI prompts when AI is used for:

- Code generation
- Prompt design
- Logic building

Maintain:

```text
docs/AI_Prompts.md
```

throughout development.

Record prompts used during development.

At submission, create:

```text
AI_Prompts.docx
```

containing:

```text
Prompt
Purpose
How it was used
Relevant output/impact
```

Do not falsely claim that AI was not used.

---

# 34. README

Create a professional README containing:

```text
Project Overview
Features
Architecture
Tech Stack
System Workflow
Folder Structure
Prerequisites
Environment Variables
Installation
Database Setup
Running Locally
Running with Docker
LLM Configuration
Local Qwen Configuration
OpenAI Configuration
Anthropic Configuration
API Documentation
Example Requests
Example Responses
Testing
Troubleshooting
AI Usage
Future Improvements
```

Include architecture diagrams where useful.

---

# 35. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Never commit real secrets.

Example:

```env
NODE_ENV=development

PORT=4000

DATABASE_URL=postgresql://...

LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=local
LLM_MODEL=qwen/qwen3.5-9b

MONITOR_INTERVAL_MS=60000

FRONTEND_URL=http://localhost:3000
```

Add provider-specific examples where appropriate.

---

# 36. CODE QUALITY

Follow these principles:

- TypeScript strict mode
- Strong typing
- Small focused functions
- Separation of concerns
- Dependency injection where useful
- Service layer
- Controller layer
- Repository/data-access separation where useful
- Centralized error handling
- Validation
- Consistent naming
- No duplicated business logic
- No magic numbers
- Configuration through environment/config files
- Clear comments only where useful

Avoid unnecessary abstractions.

Do not over-engineer.

---

# 37. IMPORTANT SCOPE CONTROL

Build in this order:

### Phase 1 — Foundation

- Monorepo
- Backend
- Frontend
- PostgreSQL
- Prisma
- Docker
- Environment configuration

### Phase 2 — Monitoring

- API configuration
- Mock APIs
- Monitoring engine
- Anomaly detection
- `/monitor`

### Phase 3 — AI

- LLM abstraction
- Local Qwen provider
- OpenAI-compatible provider
- OpenAI provider
- Anthropic provider
- Prompt
- Structured alert generation
- Fallback

### Phase 4 — Dashboard

- Overview
- API table
- Alert table
- Alert details
- Monitoring history

### Phase 5 — Automation

- Scheduler
- Automatic monitoring
- Manual run

### Phase 6 — Quality

- Logging
- Error handling
- Tests
- Security
- Health checks

### Phase 7 — Submission

- README
- Architecture documentation
- AI_Prompts.docx
- Demo preparation
- Video script

Do not implement optional features before the core requirements are working.

---

# 38. ASSESSMENT ALIGNMENT

Before considering the project complete, verify every required assessment item:

```text
[ ] Automatically monitors API responses
[ ] Detects anomalies
[ ] High response time detection
[ ] HTTP failure detection
[ ] Zero/missing records detection
[ ] AI-generated human-readable alerts
[ ] Database storage
[ ] GET /alerts
[ ] Clean frontend
[ ] Node.js
[ ] Express
[ ] Modular architecture
[ ] LLM integration
[ ] Batch processing
[ ] Error handling
[ ] Logging
[ ] README
[ ] GitHub repository
[ ] 5–10 minute explanation video
[ ] AI_Prompts.docx
```

Do not mark an item complete unless it is actually implemented and tested.

---

# 39. DEMO SCENARIO

The final demo should tell a clear story.

### Step 1

Open dashboard.

Show:

```text
4 APIs
4 Healthy
0 Active Alerts
```

### Step 2

Open mock Appointment API.

Set:

```text
HTTP 500
Slow response
0 records
```

### Step 3

Run monitoring.

Show:

```text
AppointmentAPI
500
5500ms
0 records
```

### Step 4

Backend detects:

```text
SERVER_ERROR
HIGH_RESPONSE_TIME
ZERO_RECORDS
```

### Step 5

Qwen generates:

```text
Critical alert
Possible cause
Recommended action
```

### Step 6

Alert appears on dashboard.

### Step 7

Resolve the issue.

Run monitoring again.

Show API returning to healthy state.

This should be the centerpiece of the final video.

---

# 40. FINAL VIDEO

Prepare a 5–10 minute demonstration covering:

1. Problem
2. Solution
3. Architecture
4. Technology choices
5. Monitoring workflow
6. Anomaly detection
7. Local Qwen integration
8. Provider-independent LLM architecture
9. Database
10. Dashboard
11. Failure scenario
12. AI-generated alert
13. Key engineering decisions
14. Future improvements

Keep the explanation practical rather than reading code line-by-line.

---

# 41. ENGINEERING DECISIONS TO EMPHASIZE

During implementation and final explanation, emphasize these decisions:

### Deterministic anomaly detection

Monitoring rules do not depend on AI.

### Provider-independent AI

The monitoring system can switch between:

```text
Qwen
OpenAI
Claude
Other OpenAI-compatible models
```

without changing business logic.

### Local-first development

Qwen runs locally for development and demonstration.

### Graceful AI failure

The system continues producing deterministic alerts if the LLM is unavailable.

### Structured LLM output

AI responses are validated before being stored.

### Separation of concerns

Monitoring, anomaly detection, AI generation, persistence, and presentation remain separate.

### Scalable monitoring

Multiple APIs can be processed in batches.

---

# 42. IMPORTANT RULES FOR YOU AS THE CODING AGENT

Before implementing anything:

1. Inspect the existing project.
2. Do not overwrite existing work unnecessarily.
3. Identify available dependencies.
4. Explain the proposed architecture briefly.
5. Implement incrementally.
6. After each major phase, run tests/build/type checks.
7. Fix errors before moving forward.
8. Do not fabricate successful test results.
9. Do not claim an integration works until it has actually been tested.
10. Keep configuration provider-independent.
11. Never expose secrets.
12. Never hard-code API keys.
13. Do not add unnecessary libraries.
14. Prefer simple, maintainable solutions.
15. Keep the assessment requirements as the highest priority.

If a requirement is ambiguous, choose the simplest production-appropriate interpretation and document the decision.

---

# 43. DEFINITION OF DONE

The project is complete only when:

```text
A user can:

1. Open the dashboard.
2. See configured APIs.
3. Run monitoring manually.
4. Have the system automatically monitor APIs.
5. See healthy API results.
6. Trigger a simulated API failure.
7. See the backend detect the anomaly.
8. See the anomaly stored in PostgreSQL.
9. See Qwen generate a human-readable explanation.
10. See the alert appear on the dashboard.
11. Resolve the alert.
12. Run monitoring again.
13. See the API return to healthy status.
14. Switch LLM providers through configuration.
15. Run the complete system locally.
16. Run the core infrastructure with Docker.
17. Run automated tests.
```

The final repository must be clean, documented, reproducible, and suitable for submission to a technical interviewer.

Start by **analyzing the requirements and proposing the architecture and implementation plan**. Do not immediately generate the entire codebase in one response.