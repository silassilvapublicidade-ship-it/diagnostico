# Architecture

Next.js App Router application with the product domain separated from routing.

## Phase 2A scope

Phase 1 delivered the technical foundation (App Router, strict TypeScript,
Tailwind, env validation, the deterministic 8 Dimensoes Estrategicas engine,
golden tests, local Supabase schema with RLS). Phase 2A builds the first
private end-to-end flow on top of that foundation:

- Supabase Auth (sign up, sign in, sign out, password recovery, server-side
  session, private route protection for `/app/*`).
- A 6-step new-diagnosis wizard with a discriminated Business/Creator
  briefing schema.
- Private asset uploads to Supabase Storage, with LGPD consent and
  retention fields.
- Persistence of `analysis_requests`, `analysis_answers`,
  `analysis_assets`, `analysis_jobs`, `analysis_results`,
  `analysis_scores`, and `analysis_reports`.
- An optional, explicitly-flagged development fixture path that exercises
  the same persistence pipeline without interpreting any real content.
- An initial web result view for a diagnosis (`/app/diagnosticos/[id]`).

No OpenAI integration, Mercado Pago, checkout, payment webhook, premium
PDF, full admin area, public landing page, production deployment, or
remote Supabase configuration is implemented yet. See
[docs/security.md](./security.md) for the exact gating rules around the
development fixture and the `requires_review` delivery gate.

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
  parsing (`briefing.ts`), the `createDiagnosisFromForm` Server Action and
  read helpers (`persistence.ts`), the development fixture gate
  (`development-fixture.ts`), `result_origin` typing, status/label copy,
  and the public Server Action entrypoint (`actions.ts`).
- `src/modules/assets`: upload validation (allowed MIME types, size and
  count limits) and retention/bucket constants. This is the single source
  of truth for asset validation; the domain layer does not duplicate it.
- `src/modules/auth`: session helpers (`requireUser`/`getCurrentUser`) and
  the Supabase Auth Server Actions used by the `(auth)` pages.
- `src/modules/billing`: initial product and payment constants only (no
  integration).
- `src/modules/reports`: delivery gate helper reused by the result page to
  decide whether a report may be shown as completed.
- `src/lib/supabase`: `server.ts` (SSR client, cookie-bound, RLS-scoped),
  `admin.ts` (service-role client, server-only, used exclusively by
  `modules/analysis/persistence.ts` writes), `middleware.ts` (session
  refresh + private route redirect logic).
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
session. External webhooks in later phases should use Route Handlers.

## Known trade-offs carried into Phase 2A

- `modules/analysis/persistence.ts` has no cross-table transaction. A
  failure between inserting `analysis_results` and finishing
  `analysis_scores`/`analysis_reports` leaves the result row orphaned; the
  request and the job that produced it are both marked `failed` with an
  `error_message` so the inconsistent state stays identifiable instead of
  looking like a job stuck in `processing`. See `docs/database.md` for the
  full note and `tests/unit/persistence.test.ts` for the regression test.
- Automated tests for `persistence.ts` and the auth Server Actions run
  against an in-memory fake Supabase client
  (`tests/mocks/supabase-fake.ts`) that also emulates the RLS `select`
  policies from migration `0001`, rather than a real Postgres instance —
  see the "Local validation note" in `docs/database.md`.
