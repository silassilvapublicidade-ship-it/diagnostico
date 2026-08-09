# Database

The schema lives in `supabase/migrations/`.

## Result versioning

`analysis_requests` may have many `analysis_jobs`. Each job may produce one immutable `analysis_results` row. Reprocessing creates a new job and a new result sequence instead of overwriting prior outputs.

Each result stores:

- `methodology_version`
- `prompt_version`
- `scoring_version`
- `result_version`
- `result_origin`
- `model_provider`
- `model_name`
- `weights_snapshot`
- `generated_at`
- `input_tokens`, `output_tokens`, `model_duration_ms`, `estimated_cost_usd_cents`
  (added in migration `0005`, nullable — only populated for real AI calls;
  `estimated_cost_usd_cents` is a best-effort estimate computed in
  application code from a per-model price table, not a value returned by
  the API)
- `is_test_analysis` (added in migration `0005`, not null, defaults to
  `false`)

`result_origin` is a typed enum with:

- `ai_generated`
- `development_fixture`
- `human_reviewed`

It is intentionally not stored only in JSON metadata, so fixture, AI-generated,
and human-reviewed results remain queryable and auditable.

`is_test_analysis` is a separate, orthogonal axis from `result_origin`: it
answers "was this a controlled internal test" rather than "what produced
this". Every real Anthropic-generated result in Phase 2B sets it to `true`,
because no billing exists yet — by definition nothing today is a paid,
customer-facing delivery. A future billing phase would set it based on
order/payment status instead of hardcoding `true`.

`analysis_reports.web_payload` holds the rich narrative content a real AI
result produces (executive summary, priorities, opportunities, 24h/7d/30d
action plans, content suggestions, and per-dimension diagnosis/strengths/
weaknesses/structured recommendations) — the deterministic engine
deliberately does not model any of this, so it has nowhere else to live.
For the development-fixture path it still only holds
`{score, score_kind, result_origin}`, matching the fixture's minimal
purpose (validate the pipeline, not produce a narrative reading).

## Asset retention

`analysis_assets` stores:

- `retention_until`
- `processing_consent_at`
- `deleted_at`
- optional `deletion_reason`
- minimal `metadata`

The planned retention is 90 days after analysis completion. The automatic deletion job is intentionally not implemented in Phase 1.

## RLS strategy

Customer-owned records are readable only when linked to `auth.uid()`. Version tables and prompt snapshots are service-only by default. Products and active prices are readable because they are public purchase information.

Writes for `analysis_requests`, `analysis_answers`, `analysis_assets`, `analysis_jobs`, `analysis_results`, `analysis_scores`, and `analysis_reports` happen through `modules/analysis/persistence.ts`, using the service-role admin client after `requireUser()` resolves the session — never trusting a client-supplied owner id. Evidence file bytes upload directly from the browser to the private Supabase Storage bucket through short-lived signed upload tokens scoped to the authenticated user's request path; only the resulting metadata row is recorded server-side. Orders and payments follow the same service-role-only pattern once billing is integrated in a later phase.

Customer reads for `analysis_results`, `analysis_scores`, and `analysis_reports` are intentionally conservative:

- results with `requires_review = true` are not exposed to the customer role;
- scores from results with `requires_review = true` are not exposed to the customer role;
- reports are exposed only when `analysis_reports.status = 'available'`.

This supports the product rule that a premium diagnosis cannot be delivered as completed while review is required.

`input_tokens`, `output_tokens`, `model_duration_ms`, and
`estimated_cost_usd_cents` are never exposed to the customer role. There is
no dedicated RLS policy hiding them (Postgres RLS is row-level, not
column-level) — the enforcement mechanism is the same one already in place
for `model_provider`/`model_name`/`weights_snapshot`/`raw_output`:
`getDiagnosis()` in `modules/analysis/persistence.ts` uses an explicit
column allowlist in its `select()` call, and these columns are simply never
added to it. `is_test_analysis` is the one Phase 2B column that _is_
included in that allowlist, since it drives a visible banner on the result
page rather than an internal-only value.

## Triggers

The initial migration includes `public.set_updated_at()` and applies it to:

- `profiles`;
- `orders`;
- `analysis_requests`.

## Partial persistence and retry safety

`modules/analysis/persistence.ts` does not wrap diagnosis generation in a
single cross-table transaction, in either the development-fixture path
(`createDiagnosisFromForm`) or the real Anthropic path
(`runDiagnosisAnalysisAction`) — both call the same shared
`persistAnalysisResult` helper. The realistic failure window is between the
`analysis_results` insert and the `analysis_scores`/`analysis_reports`
inserts that follow it (for example, if a request is aborted mid-flow): the
`analysis_results` row can end up persisted with no matching scores or
report yet.

This is an accepted trade-off rather than an oversight, on two conditions
that are enforced today:

- **Retries never overwrite history.** `result_sequence` is computed by
  counting existing `analysis_results` rows for the request
  (`getNextResultSequence`) and the table enforces
  `unique (analysis_request_id, result_sequence)`. A retry or a future
  reprocess always inserts a new result row; it never updates or deletes a
  prior one. Likewise, `attempt_number` on `analysis_jobs` is computed by
  `getNextAttemptNumber`, and `runDiagnosisAnalysisAction` always creates a
  brand new job (never reuses the placeholder job from submission),
  chaining it to the prior job via `parent_job_id`.
- **Inconsistent state stays identifiable.** When `createDiagnosisFromForm`
  or `runDiagnosisAnalysisAction` catch an error after an `analysis_jobs`
  row already exists, they mark that job `status = 'failed'` with
  `error_message` and `finished_at` set, in addition to marking the parent
  `analysis_request` `failed`. An orphaned `analysis_results` row is
  therefore always attached to a job and a request that are both
  explicitly `failed`, which is enough of a signature for a future
  reconciliation/cleanup job to find it — it is never left silently
  attached to a job stuck at `processing` (with one caveat: a
  platform-level timeout that kills the process mid-call, rather than an
  application-level error, never reaches this `catch` at all — see the
  "Known trade-offs" note in `docs/architecture.md`).

There is no automatic reconciliation job yet; identifying orphaned rows
today means querying for `analysis_jobs.status = 'failed'` joined to an
`analysis_results` row with no matching `analysis_reports` row. See
`tests/unit/persistence.test.ts` (`"marks the request and the
already-created job as failed..."`) and
`tests/unit/run-analysis.test.ts` (`"marks the job and request failed and
keeps retry available..."`) for the regression tests that pin this
behavior for the fixture and real-AI paths respectively.

## Local validation note

Supabase local validation requires Docker Desktop or Podman available on PATH. If neither runtime is available, `supabase start`, `supabase status`, and `supabase db lint --local` cannot inspect or migrate the local database.

In the absence of a local Postgres instance, `modules/analysis/persistence.ts`, `modules/ai/run-analysis.ts`, and the Supabase Auth Server Actions are covered by unit tests that run against an in-memory fake Supabase client (`tests/mocks/supabase-fake.ts`), including a fake `storage.download()` for reading private evidence bytes. The fake also emulates the `select` RLS policies from `0001_initial_schema.sql` for `analysis_requests`, `analysis_results`, `analysis_assets`, and `analysis_reports`, so ownership and `requires_review`/soft-delete/`status = 'available'` visibility rules are exercised even without Docker/Podman. The real Anthropic API is never called from `npm run test` either — `modules/ai/client.ts` is mocked the same way. None of this replaces `supabase db lint --local` against a real Postgres instance — it only covers the application code that talks to Supabase and Anthropic.
