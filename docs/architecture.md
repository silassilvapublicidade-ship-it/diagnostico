# Architecture

Next.js App Router application with the product domain separated from routing.

## Phase 2B scope

Phase 1 delivered the technical foundation (App Router, strict TypeScript,
Tailwind, env validation, the deterministic 8 Dimensoes Estrategicas engine,
golden tests, local Supabase schema with RLS). Phase 2A built the first
private end-to-end flow (Supabase Auth, the 6-step new-diagnosis wizard,
private asset uploads with LGPD consent/retention, persistence of
`analysis_requests/answers/assets/jobs/results/scores/reports`, and an
optional development fixture path). Phase 2B plugs the Anthropic API in as
the real interpretation layer on top of that foundation:

- A manual "Analisar agora"/"Tentar novamente" Server Action
  (`runDiagnosisAnalysisAction`) — never triggered automatically on submit —
  that calls Claude with the briefing and the private evidence, validates
  the structured output with Zod, and only then runs it through the
  deterministic engine.
- `src/modules/ai/`: the Anthropic integration boundary. The domain engine
  (`src/domain/methodology-8d`) is untouched by this phase — it has no
  knowledge that Anthropic exists.
- Rich narrative content (executive summary, priorities, opportunities,
  24h/7d/30d action plans, content suggestions) that the deterministic
  engine deliberately does not model, persisted in
  `analysis_reports.web_payload` and rendered on the result page.
- Token/cost/duration metadata recorded per AI-generated result, never
  exposed to the customer-facing read.

No Mercado Pago, checkout, payment webhook, premium PDF, full admin area,
public landing page, production deployment, or remote Supabase
configuration is implemented yet. See [docs/security.md](./security.md) for
the exact gating rules around the development fixture, the Anthropic
integration, and the `requires_review` delivery gate.

## Module boundaries

- `src/app`: route tree and visual foundation, including the private
  `/app/*` namespace (`/app`, `/app/diagnosticos`,
  `/app/diagnosticos/novo`, `/app/diagnosticos/[id]`) and the `(auth)`
  route group (`/entrar`, `/cadastro`, `/recuperar-acesso`,
  `/atualizar-senha`).
- `src/domain/methodology-8d`: pure deterministic rules only (weights,
  scoring, renormalization, confidence, review detection, Zod schemas for
  the calculation input/output). This is a legacy internal identifier and
  must not appear in public product copy. It has no knowledge of Supabase,
  HTTP, or the briefing/upload shape used by the product layer above it.
- `src/modules/analysis`: orchestration for the diagnosis flow — briefing
  parsing (`briefing.ts`), the diagnosis upload Server Actions
  (`prepareDiagnosisUploadAction` creates the request and signed upload
  tokens, `completeDiagnosisUploadAction` records the already-uploaded
  evidence, `createDiagnosisFromForm` remains as the legacy server-side
  fallback) and `runDiagnosisAnalysisAction` plus shared persistence helpers
  (`persistence.ts`, including `persistAnalysisResult` — shared by the
  development-fixture path and the real Anthropic path),
  the development fixture gate (`development-fixture.ts`), `result_origin`
  typing, status/label copy, and the public Server Action entrypoint
  (`actions.ts`).
- `src/modules/ai`: the Anthropic integration boundary — `client.ts`
  (server-only, mockable Anthropic client factory), `prompt.ts` (the
  versioned system prompt and message assembly; the only place prompt text
  is built), `output-schema.ts` (the rigid Zod schema for the AI's
  structured output, reusing the domain's own enums), `map-to-domain.ts`
  (pure mapping from validated AI output to the domain's
  `AnalysisCalculationInput`, plus the `web_payload` narrative extraction),
  and `run-analysis.ts` (loads briefing/evidence with an explicit ownership
  check, calls Anthropic, and runs the result through the domain engine).
- `src/modules/assets`: upload validation (allowed MIME types, size and
  count limits) and retention/bucket constants. This is the single source
  of truth for asset validation; the domain layer does not duplicate it.
- `src/modules/auth`: session helpers (`requireUser`/`getCurrentUser`) and
  the Supabase Auth Server Actions used by the `(auth)` pages.
- `src/modules/billing`: initial product and payment constants only (no
  integration).
- `src/modules/reports`: delivery gate helper reused by the result page to
  decide whether a report may be shown as completed.
- `src/lib/supabase`: `server.ts` (SSR client, cookie-bound, RLS-scoped —
  used for all reads, including loading briefing/evidence for the
  Anthropic call), `admin.ts` (service-role client, server-only, used
  exclusively for writes and for the explicit ownership check before an
  analysis job is created), `middleware.ts` (session refresh + private
  route redirect logic).
- `src/proxy.ts`: this codebase's Next.js entrypoint for running
  `middleware.ts` on every request (`proxy`/`proxyConfig`) — see the
  breaking-changes note in `AGENTS.md` before assuming this is the
  conventional `middleware.ts` entrypoint from older Next.js versions.
- `supabase/migrations`: local database schema (see
  [docs/database.md](./database.md)).

## Runtime decisions

Use the default Node.js runtime. Internal reads should prefer Server
Components (`listDiagnoses`, `getDiagnosis` run through the RLS-scoped
server client). UI mutations should prefer Server Actions
(`createDiagnosisFromForm`, the auth actions) writing through the
service-role admin client only after `requireUser()` has resolved the
session. Evidence files must upload directly from the browser to Supabase
Storage through short-lived signed upload tokens; Vercel Functions should
only receive small metadata payloads because production request bodies have a
platform limit. External webhooks in later phases should use Route Handlers.

## Known trade-offs

- `modules/analysis/persistence.ts` has no cross-table transaction. A
  failure between inserting `analysis_results` and finishing
  `analysis_scores`/`analysis_reports` leaves the result row orphaned; the
  request and the job that produced it are both marked `failed` with an
  `error_message` so the inconsistent state stays identifiable instead of
  looking like a job stuck in `processing`. This applies to both the
  development-fixture path and the real Anthropic path (they share
  `persistAnalysisResult`). See `docs/database.md` for the full note and
  `tests/unit/persistence.test.ts`/`tests/unit/run-analysis.test.ts` for
  the regression tests.
- Automated tests for `persistence.ts`, the auth Server Actions, and
  `modules/ai/run-analysis.ts` run against an in-memory fake Supabase
  client (`tests/mocks/supabase-fake.ts`) that also emulates the RLS
  `select` policies from migrations `0001`/`0005`, rather than a real
  Postgres instance — see the "Local validation note" in
  `docs/database.md`. `modules/ai/client.ts` is mocked the same way the
  Supabase clients already are (`vi.mock("@/modules/ai/client")`), so no
  test in `npm run test` ever calls the real Anthropic API.
- A platform-level timeout killing the process mid-call (as opposed to an
  application-level error, which the `catch` block already handles) can
  leave a job stuck at `processing` with no `error_message`. Mitigated by
  making "Analisar agora"/"Tentar novamente" always clickable regardless of
  the request's current status — there is no staleness detection, this is
  an accepted limitation for Phase 2B.
