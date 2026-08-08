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

`result_origin` is a typed enum with:

- `ai_generated`
- `development_fixture`
- `human_reviewed`

It is intentionally not stored only in JSON metadata, so fixture, AI-generated,
and human-reviewed results remain queryable and auditable.

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

Writes for `analysis_requests`, `analysis_answers`, `analysis_assets`, `analysis_jobs`, `analysis_results`, `analysis_scores`, and `analysis_reports` happen through `modules/analysis/persistence.ts`, using the service-role admin client after `requireUser()` resolves the session — never from the browser and never trusting a client-supplied owner id. Orders and payments follow the same service-role-only pattern once billing is integrated in a later phase.

Customer reads for `analysis_results`, `analysis_scores`, and `analysis_reports` are intentionally conservative:

- results with `requires_review = true` are not exposed to the customer role;
- scores from results with `requires_review = true` are not exposed to the customer role;
- reports are exposed only when `analysis_reports.status = 'available'`.

This supports the product rule that a premium diagnosis cannot be delivered as completed while review is required.

## Triggers

The initial migration includes `public.set_updated_at()` and applies it to:

- `profiles`;
- `orders`;
- `analysis_requests`.

## Partial persistence and retry safety

`modules/analysis/persistence.ts` does not wrap the diagnosis submission in
a single cross-table transaction. The realistic failure window is between
the `analysis_results` insert and the `analysis_scores`/`analysis_reports`
inserts that follow it (for example, if a request is aborted mid-flow):
the `analysis_results` row can end up persisted with no matching scores or
report yet.

This is an accepted trade-off for Phase 2A rather than an oversight, on
two conditions that are enforced today:

- **Retries never overwrite history.** `result_sequence` is computed by
  counting existing `analysis_results` rows for the request
  (`getNextResultSequence`) and the table enforces
  `unique (analysis_request_id, result_sequence)`. A retry or a future
  reprocess always inserts a new result row; it never updates or deletes a
  prior one.
- **Inconsistent state stays identifiable.** When `createDiagnosisFromForm`
  catches an error after an `analysis_jobs` row already exists, it marks
  that job `status = 'failed'` with `error_message` and `finished_at` set,
  in addition to marking the parent `analysis_request` `failed`. An
  orphaned `analysis_results` row is therefore always attached to a job
  and a request that are both explicitly `failed`, which is enough of a
  signature for a future reconciliation/cleanup job to find it — it is
  never left silently attached to a job stuck at `processing`.

There is no automatic reconciliation job yet; identifying orphaned rows
today means querying for `analysis_jobs.status = 'failed'` joined to an
`analysis_results` row with no matching `analysis_reports` row. See
`tests/unit/persistence.test.ts` (`"marks the request and the
already-created job as failed..."`) for the regression test that pins this
behavior.

## Local validation note

Supabase local validation requires Docker Desktop or Podman available on PATH. If neither runtime is available, `supabase start`, `supabase status`, and `supabase db lint --local` cannot inspect or migrate the local database.

In the absence of a local Postgres instance, `modules/analysis/persistence.ts` and the Supabase Auth Server Actions are covered by unit tests that run against an in-memory fake Supabase client (`tests/mocks/supabase-fake.ts`). The fake also emulates the `select` RLS policies from `0001_initial_schema.sql` for `analysis_requests`, `analysis_results`, and `analysis_assets`, so ownership and `requires_review`/soft-delete visibility rules are exercised even without Docker/Podman. This does not replace `supabase db lint --local` against a real Postgres instance — it only covers the application code that talks to Supabase.
