# Diagnostico Estrategico de Perfil

Fundacao tecnica da plataforma privada de diagnostico estrategico de perfis baseada na Metodologia Silas Silva de Diagnostico Estrategico.

## Fase atual

Fase 1 tecnica:

- Next.js App Router;
- TypeScript strict;
- Tailwind CSS;
- lint, format e Vitest;
- validacao de env com Zod;
- dominio deterministico das 8 Dimensoes Estrategicas;
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
- `docs/methodology-8d.md` (identificador tecnico legado)
- `docs/database.md`
- `docs/security.md`
