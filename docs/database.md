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

Writes for orders, payments, jobs, results, and reports are expected to happen through server-side service-role flows in later phases, never from the browser.

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

## Local validation note

Supabase local validation requires Docker Desktop or Podman available on PATH. If neither runtime is available, `supabase start`, `supabase status`, and `supabase db lint --local` cannot inspect or migrate the local database.
