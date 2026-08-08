# Architecture

This project starts as a Next.js App Router application with the product domain separated from routing.

## Phase 1 scope

- Next.js App Router foundation.
- Strict TypeScript.
- Tailwind CSS foundation.
- Environment validation.
- Deterministic Methodology 8D domain services.
- Zod schemas.
- Golden tests for the three approved scenarios.
- Local Supabase schema migration with RLS.

No OpenAI, Mercado Pago, checkout, webhook, PDF, admin, production deployment, or remote Supabase configuration is implemented in this phase.

## Module boundaries

- `src/app`: route tree and minimal visual foundation.
- `src/domain/methodology-8d`: pure deterministic rules.
- `src/modules/analysis`: future orchestration boundary for requests, jobs, and results.
- `src/modules/assets`: asset retention and upload policy constants.
- `src/modules/auth`: access activation strategy.
- `src/modules/billing`: initial product and payment constants.
- `src/modules/reports`: delivery gate for completed reports.
- `src/lib`: shared infrastructure helpers.
- `supabase/migrations`: local database schema.

## Runtime decisions

Use the default Node.js runtime. Internal reads should prefer Server Components. UI mutations should prefer Server Actions. External webhooks in later phases should use Route Handlers.
