# Diagnostico Estrategico de Perfil

Fundacao tecnica da plataforma de diagnostico estrategico de perfis baseada na Metodologia 8D.

## Fase atual

Fase 1 tecnica:

- Next.js App Router;
- TypeScript strict;
- Tailwind CSS;
- lint, format e Vitest;
- validacao de env com Zod;
- dominio deterministico da Metodologia 8D;
- fixtures golden;
- migration local Supabase com RLS inicial;
- fundacao visual minima.

Nao ha integracao ativa com OpenAI, Mercado Pago, checkout, webhook, PDF real, admin, deploy ou Supabase remoto nesta fase.

## Comandos

```bash
npm run typecheck
npm run lint
npm run test
npm run format:check
npm run build
```

## Documentacao

- `docs/architecture.md`
- `docs/methodology-8d.md`
- `docs/database.md`
- `docs/security.md`
