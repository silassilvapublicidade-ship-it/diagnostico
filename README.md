# Diagnostico Estrategico de Perfil

Plataforma privada de diagnostico estrategico de perfis, baseada na Metodologia
Silas Silva de Diagnostico Estrategico (estrutura das 8 Dimensoes
Estrategicas).

## Fase atual: Fase 2B

A Fase 2A entregou a fundacao tecnica e o primeiro fluxo privado ponta a
ponta (Auth, wizard de envio, engine deterministico, development fixtures).
A Fase 2B pluga a Anthropic API como camada de interpretacao real de briefing
e evidencias, mantendo o engine deterministico como unica fonte de score,
classificacao, confidence e `requires_review`. Ja existem:

- tudo da Fase 2A (Supabase Auth, rotas privadas, wizard de 6 etapas,
  uploads privados, LGPD, persistencia de `analysis_requests/answers/assets/
jobs/results/scores/reports`, engine deterministico, development fixtures);
- integracao real com a Anthropic API (`@anthropic-ai/sdk`, modelo
  configuravel via `ANTHROPIC_MODEL`, saida estruturada validada por Zod)
  em `src/modules/ai/`, chamada manualmente pelo botao "Analisar agora" —
  nunca automaticamente no envio;
- a IA propoe leitura por dimensao (score, evidencias, forcas, fraquezas,
  diagnostico narrativo, recomendacoes estruturadas e sinais de revisao);
  o score geral, a renormalizacao, a classificacao, a confidence e a decisao
  de `requires_review` continuam exclusivamente no engine deterministico;
- conteudo narrativo rico (resumo executivo, prioridades, oportunidades,
  planos de 24h/7d/30d, sugestoes de conteudo) persistido em
  `analysis_reports.web_payload` e exibido na pagina de resultado;
- registro de `input_tokens`/`output_tokens`/`model_duration_ms`/custo
  estimado por resultado gerado por IA — nunca exposto ao cliente;
  `is_test_analysis` marcado como verdadeiro em toda analise real desta
  fase (nao ha cobranca ainda) e exibido como aviso na pagina de resultado;
- reprocessamento manual ("Tentar novamente") que sempre cria um novo
  `analysis_job`, preservando o historico de tentativas e resultados
  anteriores.

Ainda **nao** existem nesta fase:

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
