import type { AiDiagnosisOutput } from "../../src/modules/ai/output-schema";

type AiDimensionFixture = Omit<
  AiDiagnosisOutput["dimensions"][number],
  "strategic_diagnosis"
>;

function recommendation(
  overrides: Partial<
    AiDiagnosisOutput["dimensions"][number]["recommendations"][number]
  >,
): AiDiagnosisOutput["dimensions"][number]["recommendations"][number] {
  return {
    what_was_identified: "Padrao identificado nas evidencias enviadas.",
    why_it_matters:
      "Impacta diretamente a clareza da proposta para quem visita o perfil.",
    how_to_execute: "Ajustar o elemento indicado nas proximas publicacoes.",
    priority: "high",
    effort: "low",
    expected_impact:
      "Pode melhorar a clareza percebida, sem garantia de resultado.",
    supporting_evidence: "Screenshot do topo do perfil.",
    ...overrides,
  };
}

function strategicDiagnosis(
  dimension: AiDimensionFixture,
): AiDiagnosisOutput["dimensions"][number]["strategic_diagnosis"] {
  const primaryEvidence =
    dimension.evidences[0]?.source_reference ??
    dimension.evidence_gaps[0] ??
    "evidencias ausentes";
  const recommendation = dimension.recommendations[0]!;
  const gaps =
    dimension.evidence_gaps.length > 0
      ? ` Lacunas relevantes: ${dimension.evidence_gaps.slice(0, 2).join(", ")}.`
      : "";

  return {
    problem: dimension.diagnosis,
    evidence: `Identificado a partir de ${primaryEvidence}.${gaps}`,
    consequence: recommendation.why_it_matters,
    correction: recommendation.how_to_execute,
    practical_example: recommendation.how_to_execute,
    next_step: `Executar primeiro: ${recommendation.how_to_execute}`,
  };
}

function withStrategicDiagnosis(
  dimensions: AiDimensionFixture[],
): AiDiagnosisOutput["dimensions"] {
  return dimensions.map((dimension) => ({
    ...dimension,
    strategic_diagnosis: strategicDiagnosis(dimension),
  }));
}

export const aiOutputBusinessComplete = {
  dimensions: withStrategicDiagnosis([
    {
      dimension: "positioning",
      status: "evaluated",
      proposed_score: 68,
      confidence: "high",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "topo do perfil",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Bio comunica o segmento com clareza."],
      weaknesses: ["Sem transformacao explicita prometida."],
      diagnosis:
        "O posicionamento comunica publico e problema, mas nao a transformacao esperada.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Reescrever a bio em torno de publico, problema, transformacao e proximo passo.",
        }),
      ],
      limitations: ["Nenhum dado de vendas foi fornecido."],
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      proposed_score: 58,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "profile_top",
          observed_area: "primeira tela do perfil",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Destaques organizados por tema."],
      weaknesses: ["Falta chamada clara para o proximo passo."],
      diagnosis:
        "A primeira tela nao responde com clareza para quem serve e o que fazer a seguir.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Usar a primeira tela para responder para quem e, por que confiar e o que fazer a seguir.",
        }),
      ],
      limitations: ["Stories nao foram avaliados."],
    },
    {
      dimension: "authority",
      status: "evaluated",
      proposed_score: 62,
      confidence: "medium",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "conteudo educativo",
          confidence: "medium",
          limitations: ["Amostra pequena de posts."],
        },
      ],
      evidence_gaps: ["Contexto completo de casos."],
      strengths: ["Conteudo educativo recorrente."],
      weaknesses: ["Prova social pouco explicita."],
      diagnosis:
        "Ha sinais de autoridade tecnica, mas as provas nao sao organizadas de forma explicita.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Organizar provas em torno das duvidas e do processo, sem prometer resultado.",
        }),
      ],
      limitations: [
        "Resultados nao podem ser generalizados sem mais evidencia.",
      ],
    },
    {
      dimension: "content",
      status: "evaluated",
      proposed_score: 54,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "grade de posts",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Temas recorrentes de educacao."],
      weaknesses: ["Falta pilar de conversao explicito."],
      diagnosis:
        "O conteudo cobre educacao mas nao fecha o ciclo ate a conversao.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar pilares de conteudo para dor, educacao, prova de processo e conversao.",
        }),
      ],
      limitations: ["Performance por post nao foi fornecida."],
    },
    {
      dimension: "identity",
      status: "evaluated",
      proposed_score: 61,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "tom visual",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Tom visual consistente."],
      weaknesses: ["Falta assinatura verbal recorrente."],
      diagnosis:
        "A identidade visual e coerente, mas falta uma assinatura verbal que se repita.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar uma assinatura verbal e visual recorrente que reforce o posicionamento.",
        }),
      ],
      limitations: ["Ativos de marca nao foram fornecidos."],
    },
    {
      dimension: "conversion",
      status: "evaluated",
      proposed_score: 46,
      confidence: "high",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "link da bio",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["CTA presente na bio."],
      weaknesses: ["Link nao explica o proximo passo."],
      diagnosis:
        "Existe um caminho de conversao, mas ele nao explica o que acontece ao clicar.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Mover o WhatsApp para o primeiro link e explicar o que acontece na primeira conversa.",
        }),
      ],
      limitations: ["Nenhuma taxa de conversao real foi fornecida."],
    },
    {
      dimension: "relationship",
      status: "evaluated",
      proposed_score: 50,
      confidence: "medium",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "briefing",
          observed_area: "tom de conteudo",
          confidence: "medium",
          limitations: ["Sem evidencia direta de interacao."],
        },
      ],
      evidence_gaps: ["Comentarios", "respostas em stories"],
      strengths: ["Tom acolhedor no conteudo."],
      weaknesses: ["Sem evidencia de interacao real."],
      diagnosis:
        "O tom sugere proximidade, mas nao ha evidencia direta de interacao com a audiencia.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Usar perguntas de baixo atrito ligadas a rotina e organizacao.",
        }),
      ],
      limitations: [
        "Qualidade do relacionamento nao pode ser confirmada apenas pelo feed.",
      ],
    },
    {
      dimension: "opportunities",
      status: "evaluated",
      proposed_score: 72,
      confidence: "high",
      evidences: [
        {
          evidence_type: "inferred",
          source_reference: "briefing",
          observed_area: "lacunas de posicionamento e conversao",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Lacunas claras de posicionamento e conversao."],
      weaknesses: [],
      diagnosis:
        "As lacunas de posicionamento e conversao apontam para um metodo simples e visivel.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Transformar a abordagem em um metodo simples de tres passos visivel no perfil.",
        }),
      ],
      limitations: ["Nenhum dado de aquisicao paga foi fornecido."],
    },
  ]),
  executive_summary:
    "O perfil comunica segmento e conteudo educativo com consistencia, mas o caminho ate a conversao ainda nao esta explicito.",
  priorities: [
    "Clarificar o proximo passo na bio.",
    "Fechar o ciclo de conteudo ate a conversao.",
  ],
  opportunities: ["Transformar o metodo em um formato visivel de tres passos."],
  action_plan_24h: ["Mover o link de WhatsApp para o topo da bio."],
  action_plan_7d: ["Publicar um post explicando o metodo em tres passos."],
  action_plan_30d: [
    "Criar uma sequencia de conteudo educacao -> prova -> conversao.",
  ],
  content_suggestions: ["Serie de bastidores do processo de atendimento."],
  global_limitations: [
    "Nenhum dado de vendas ou conversao real foi fornecido.",
  ],
  review_signals: [],
} satisfies AiDiagnosisOutput;
