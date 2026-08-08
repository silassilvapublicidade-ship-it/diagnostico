# Security foundation

Phase 1 prepares the security shape without activating external integrations.

## Rules

- Secrets remain server-only.
- `.env.example` contains placeholders only.
- RLS is enabled in the initial migration.
- Analysis assets are modeled as private storage objects.
- Service-role access is not exposed to the client.
- Service-role writes are limited to server-only actions after session ownership
  checks.
- Zod validates domain and environment structures.
- IDs use UUIDs.
- Audit logs are modeled from the start.
- Asset retention and deletion fields are present for LGPD workflows.

## Development fixture

The development fixture path is never selected by browser parameters. It is
available only when:

- `NODE_ENV=development`
- `ENABLE_DEVELOPMENT_FIXTURES=true`

Fixture results must persist `result_origin = 'development_fixture'` and display
an explicit warning in the result page. The deterministic engine still only
handles weights, scoring, renormalization, confidence, insufficient evidence,
review gates, classification, and structural validation.

## Requires review

The application must not make a premium report available as completed while `requires_review = true`.

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
