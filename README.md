# Diagnostico Estrategico de Perfil

Plataforma privada de diagnostico estrategico de perfis, baseada na Metodologia
Silas Silva de Diagnostico Estrategico (estrutura das 8 Dimensoes
Estrategicas).

## Fase atual: Fase 2A

A Fase 2A entrega a fundacao tecnica completa e o primeiro fluxo privado
ponta a ponta. Ja existem:

- Supabase Auth (cadastro, login, logout, recuperacao de acesso, sessao
  server-side, proteção de rotas privadas em `/app/*`);
- wizard de novo diagnostico em 6 etapas (perfil, objetivo, contexto e
  dificuldades, evidencias, revisao e consentimento, envio), com briefing
  dedicado para perfil Business e para perfil Creator;
- uploads privados de evidencias (screenshots/PDF) em bucket Supabase
  Storage nao publico;
- consentimento e retencao LGPD (`processing_consent_at`,
  `retention_until` com prazo inicial de 90 dias);
- persistencia de `analysis_requests`, `analysis_answers`,
  `analysis_assets`, `analysis_jobs`, `analysis_results`, `analysis_scores`
  e `analysis_reports`;
- engine deterministico das 8 Dimensoes Estrategicas (pesos, scoring,
  renormalizacao, confidence, `insufficient_evidence`, `requires_review`,
  bloqueio de entrega do relatorio);
- development fixtures opcionais (`NODE_ENV=development` +
  `ENABLE_DEVELOPMENT_FIXTURES=true`), que exercitam o pipeline completo
  sem qualquer interpretacao real de conteudo;
- resultado web inicial (`/app/diagnosticos/[id]`) com score, dimensoes e
  aviso explicito quando o resultado exibido e um development fixture.

Ainda **nao** existem nesta fase:

- integracao real com OpenAI (ha apenas constantes/placeholders de
  configuracao, nunca chamados);
- Mercado Pago, checkout ou qualquer fluxo de pagamento;
- webhook de pagamento;
- PDF premium do diagnostico;
- area administrativa completa;
- landing page publica final;
- deploy de producao ou Supabase remoto configurado por esta base de
  codigo.

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
