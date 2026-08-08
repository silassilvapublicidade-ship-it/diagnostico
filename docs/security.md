# Security foundation

Phase 1 prepares the security shape without activating external integrations.

## Rules

- Secrets remain server-only.
- `.env.example` contains placeholders only.
- RLS is enabled in the initial migration.
- Analysis assets are modeled as private storage objects.
- Service-role access is not exposed to the client.
- Zod validates domain and environment structures.
- IDs use UUIDs.
- Audit logs are modeled from the start.
- Asset retention and deletion fields are present for LGPD workflows.

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
