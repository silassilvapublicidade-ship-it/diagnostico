# Security foundation

Phase 1 prepared the security shape. Phase 2A activated it end to end for
Supabase Auth and the diagnosis submission flow. Phase 2B adds the Anthropic
API as the only external integration beyond Supabase, under the same
server-only, ownership-checked posture.

## Rules

- Secrets remain server-only. `ANTHROPIC_API_KEY` is read only by
  `src/modules/ai/client.ts` (guarded by `import "server-only"`) via
  `getServerEnv()`; there is no `NEXT_PUBLIC_ANTHROPIC_API_KEY` and the key
  never reaches a Client Component.
- `.env.example` contains placeholders only.
- RLS is enabled in the initial migration and enforced on every read that
  goes through `createSupabaseServerClient()` (`listDiagnoses`,
  `getDiagnosis`, and — in Phase 2B — `modules/ai/run-analysis.ts` loading
  the briefing, answers, and evidence bytes for the Anthropic call).
- Analysis assets are modeled as private storage objects; the storage
  bucket is created non-public in `0001_initial_schema.sql`. Browser uploads
  use short-lived signed upload tokens generated server-side after
  `requireUser()` and scoped to the path
  `{user_id}/{analysis_request_id}/{asset_type}/{filename}` so evidence files
  do not pass through a Vercel Function payload. Evidence reads remain
  private: files sent to Anthropic are read as bytes server-side and inlined
  as base64 in the request. No signed read URL is generated for customer or AI
  access.
- Service-role access is not exposed to the client. `src/lib/supabase/admin.ts`
  is guarded by `import "server-only"` and is only ever called from
  `modules/analysis/persistence.ts` and `modules/analysis/actions.ts`
  (writes and the explicit ownership/duplicate-run check before an
  analysis job is created) — never for reading briefing or evidence
  content, which always goes through the RLS-scoped client instead. This
  structural boundary is asserted in
  `tests/unit/persistence-security.test.ts`, extended in Phase 2B to also
  cover `modules/ai/client.ts`.
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
  is the only upload validation; `modules/ai/output-schema.ts` is the only
  schema for the Anthropic structured output, reusing the domain's enums
  (`dimensionKeySchema`, `confidenceLevelSchema`, `evidenceTypeSchema`,
  `reviewReasonSchema`) rather than duplicating them. An earlier, unused
  `briefingSchema` / `analysisAssetSchema` pair inside the domain layer was
  removed in the Phase 2A sanitation pass to avoid two schemas with
  equivalent responsibility drifting apart.
- IDs use UUIDs.
- Audit logs are modeled from the start.
- Asset retention and deletion fields are present for LGPD workflows.
- Error messages surfaced from a failed Anthropic call (API outage,
  timeout, rate limit, refusal, schema validation failure) never include
  the full prompt, the briefing text, or evidence bytes — only short,
  structured descriptions (see `modules/ai/run-analysis.ts`).

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
- An AI analysis can never run against another user's request.
  `runDiagnosisAnalysisAction` explicitly compares the request's `user_id`
  against `requireUser()`'s session user before creating a job or calling
  Anthropic (this write path uses the admin client, which bypasses RLS by
  design, so the check must be explicit); `modules/ai/run-analysis.ts` then
  loads the briefing and evidence through the RLS-scoped server client with
  a second, redundant ownership assertion. Both layers are exercised in
  `tests/unit/run-analysis.test.ts` — a forged `requestId` for another
  user's diagnosis creates no job and never reaches the Anthropic client.

## Anthropic integration

- The AI is called only through the manual "Analisar agora"/"Tentar
  novamente" Server Action — never automatically on submission, and never
  from a Route Handler reachable without a session.
- The model is never hardcoded in more than one place: `ANTHROPIC_MODEL`
  (default `claude-sonnet-5`) is read once, in `modules/ai/client.ts`.
- The AI's structured output is validated with `client.messages.parse()` +
  `zodOutputFormat(aiDiagnosisOutputSchema)`; `response.parsed_output` is
  `null` whenever the output does not satisfy the full Zod schema (including
  constraints stripped from the wire-level JSON Schema, like score ranges),
  and a `null` result is always treated as a job failure, never as a
  persisted result with `requires_review`.
- `response.stop_reason` is checked before trusting any output:
  `"refusal"` (Anthropic's safety classifiers declined the request) and
  `"max_tokens"` (truncated output) are both treated as job failures.
- A duplicate concurrent run is rejected: `runDiagnosisAnalysisAction`
  checks for an existing `analysis_jobs` row with `status = 'processing'`
  for the request before creating a new one, so a double click cannot
  trigger two paid-equivalent Anthropic calls or race over which result
  becomes "latest".

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

The application must not make a premium report available as completed while `requires_review = true`. This is enforced at three layers: the domain engine (`resolveFinalAnalysisStatus`/`assertReportCanBeCompleted`), the persistence write path (`analysis_reports.status` is only ever `'available'` when `requiresReview` is false — shared by the fixture and real-AI paths via `persistAnalysisResult`, see `tests/unit/persistence-security.test.ts`), and RLS (`analysis_results`/`analysis_scores`/`analysis_reports` with `requires_review = true` or `status != 'available'` are not selectable by the customer role, even for the row's own owner).

For the real Anthropic path, the AI never sets `requires_review` or decides review is needed by itself. It can only propose `review_signals` (using the domain's own `ReviewReason` enum) describing what it observed; those signals are passed into `calculateAnalysisResult`'s `reviewSignals` parameter and combined with the engine's own structural signals inside `detectRequiresReview` — the engine always makes the final call. This is asserted in `tests/unit/persistence-security.test.ts` (fixture path) and `tests/unit/map-to-domain.test.ts` (real-AI mapping path).

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
- low global confidence in a critical analysis;
- incomplete briefing;
- unclear bio link;
- no relationship evidence.
