# Security foundation

Phase 1 prepared the security shape. Phase 2A activates it end to end for
Supabase Auth and the diagnosis submission flow, still without any external
integration beyond Supabase.

## Rules

- Secrets remain server-only.
- `.env.example` contains placeholders only.
- RLS is enabled in the initial migration and enforced on every read that
  goes through `createSupabaseServerClient()` (`listDiagnoses`,
  `getDiagnosis`).
- Analysis assets are modeled as private storage objects; the storage
  bucket is created non-public in `0001_initial_schema.sql`.
- Service-role access is not exposed to the client. `src/lib/supabase/admin.ts`
  is guarded by `import "server-only"` and is only ever called from
  `modules/analysis/persistence.ts`.
- Service-role writes are limited to server-only Server Actions, after
  `requireUser()` resolves the session. The owning `user_id` written to
  `analysis_requests` and `analysis_assets` always comes from that
  session-derived user, never from form input — this is asserted directly
  in `tests/unit/persistence-security.test.ts`.
- Zod validates domain and environment structures. There is a single
  schema per concern: `src/domain/methodology-8d/schemas.ts` only
  validates the scoring engine's own input/output shape;
  `modules/analysis/briefing.ts` is the only briefing schema
  (business/creator discriminated union); `modules/assets/validation.ts`
  is the only upload validation. An earlier, unused `briefingSchema` /
  `analysisAssetSchema` pair inside the domain layer was removed in the
  Phase 2A sanitation pass to avoid two schemas with equivalent
  responsibility drifting apart.
- IDs use UUIDs.
- Audit logs are modeled from the start.
- Asset retention and deletion fields are present for LGPD workflows.

## Ownership boundaries

- A user can only see their own `analysis_requests`, and — through the
  request — their own `analysis_results`, `analysis_scores`, and
  `analysis_assets`; this is enforced by RLS at the database level and
  exercised in `tests/unit/persistence-security.test.ts` against an RLS-
  emulating fake Supabase client (see `docs/database.md`).
- `createDiagnosisFromForm` never reads a `user_id`/`userId` field from the
  submitted form; the owner is always `requireUser()`'s session user, so a
  crafted form field cannot reassign a request or an asset to a different
  account.
- A soft-deleted asset (`deleted_at` set) is excluded from customer reads
  even for its own owner, mirroring the `analysis_assets_select_own_request`
  policy.

## Development fixture

The development fixture path is never selected by browser parameters. It is
available only when both are true, checked via
`modules/analysis/development-fixture.ts#isDevelopmentFixturesEnabled`
(the single gate `createDiagnosisFromForm` consults; there is no
inline/duplicated copy of this condition elsewhere in the persistence flow):

- `NODE_ENV=development`
- `ENABLE_DEVELOPMENT_FIXTURES=true`

Fixture results must persist `result_origin = 'development_fixture'` and display
an explicit warning in the result page. The deterministic engine still only
handles weights, scoring, renormalization, confidence, insufficient evidence,
review gates, classification, and structural validation.

## Requires review

The application must not make a premium report available as completed while `requires_review = true`. This is enforced at three layers: the domain engine (`resolveFinalAnalysisStatus`/`assertReportCanBeCompleted`), the persistence write path (`analysis_reports.status` is only ever `'available'` when `requiresReview` is false — see `tests/unit/persistence-security.test.ts`), and RLS (`analysis_results`/`analysis_scores` with `requires_review = true` are not selectable by the customer role, even for the row's own owner).

Review can be triggered by:

- fewer than five evaluable dimensions;
- relevant contradiction between briefing and evidence;
- unreadable image in a central dimension;
- sensitive content;
- reputational risk;
- privacy risk;
- missing metric inference risk;
- strong ambiguity;
- harmful commercial recommendation risk;
- structural validation failure;
- low global confidence in a critical analysis.
