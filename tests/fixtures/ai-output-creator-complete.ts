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
      "Impacta a percepcao de identidade e diferenciacao do perfil.",
    how_to_execute: "Ajustar o elemento indicado nas proximas publicacoes.",
    priority: "high",
    effort: "low",
    expected_impact:
      "Pode reforcar a identidade percebida, sem garantia de resultado.",
    supporting_evidence: "Screenshot do feed.",
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

export const aiOutputCreatorComplete = {
  dimensions: withStrategicDiagnosis([
    {
      dimension: "positioning",
      status: "evaluated",
      proposed_score: 76,
      confidence: "high",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "nome e bio",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Territorio local reconhecivel."],
      weaknesses: ["Termo generico de custo-beneficio."],
      diagnosis:
        "O territorio local esta claro, mas a curadoria de custo-beneficio ainda soa generica.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Evoluir de comida barata para curadoria honesta de custo-beneficio em Belo Horizonte.",
        }),
      ],
      limitations: ["Posicionamento comercial inferido apenas do perfil."],
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      proposed_score: 63,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "profile_top",
          observed_area: "topo do perfil",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Destaques organizados."],
      weaknesses: ["Falta rota para marcas."],
      diagnosis:
        "A primeira tela acolhe seguidores, mas nao guia marcas interessadas em parceria.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar destaques Comece aqui e Parcerias para novos seguidores e marcas.",
        }),
      ],
      limitations: ["Comportamento de novos visitantes nao foi medido."],
    },
    {
      dimension: "authority",
      status: "evaluated",
      proposed_score: 58,
      confidence: "medium",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "conteudo opinativo",
          confidence: "medium",
          limitations: ["Amostra parcial do feed."],
        },
      ],
      evidence_gaps: ["Criterios formais de avaliacao."],
      strengths: ["Repertorio local consistente."],
      weaknesses: ["Criterios de avaliacao implicitos."],
      diagnosis:
        "A autoridade vem da curadoria, mas os criterios de avaliacao nao sao explicitos.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Publicar criterios claros de como os lugares sao escolhidos e avaliados.",
        }),
      ],
      limitations: ["Autoridade vem de curadoria, nao de credencial formal."],
    },
    {
      dimension: "content",
      status: "evaluated",
      proposed_score: 74,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "reels e listas",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Formatos variados e recorrentes."],
      weaknesses: ["Retencao nao pode ser avaliada."],
      diagnosis:
        "O conteudo tem variedade e recorrencia, mas falta retencao mensuravel.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar series editoriais recorrentes como Vale o preco e PF honesto.",
        }),
      ],
      limitations: ["Retencao nao foi fornecida."],
    },
    {
      dimension: "identity",
      status: "evaluated",
      proposed_score: 81,
      confidence: "high",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "tom e linguagem",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Voz local e bem-humorada consistente."],
      weaknesses: ["Sistema de capa minimo ausente."],
      diagnosis:
        "A identidade verbal e forte e consistente; falta um sistema visual leve de reconhecimento.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Manter a voz local e adicionar um sistema minimo de capas para reconhecimento.",
        }),
      ],
      limitations: ["Sistema completo de marca nao foi avaliado."],
    },
    {
      dimension: "conversion",
      status: "evaluated",
      proposed_score: 47,
      confidence: "high",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "link e email",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Canal de contato declarado."],
      weaknesses: ["Sem media kit ou criterio comercial visivel."],
      diagnosis:
        "Existe um canal de contato, mas falta uma pagina comercial que explique formatos e criterios.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar uma pagina simples de parceria com publico, formatos e principios editoriais.",
        }),
      ],
      limitations: [
        "Conversao de parcerias nao pode ser confirmada sem contatos reais.",
      ],
    },
    {
      dimension: "relationship",
      status: "evaluated",
      proposed_score: 66,
      confidence: "medium",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "briefing",
          observed_area: "mensagens declaradas da audiencia",
          confidence: "medium",
          limitations: ["Sem prints de comentarios ou DMs."],
        },
      ],
      evidence_gaps: ["Comentarios", "prints de DM"],
      strengths: ["Salvamentos e compartilhamentos declarados."],
      weaknesses: ["Sem amostra direta de interacao."],
      diagnosis:
        "Ha sinais de comunidade engajada, mas sem amostra direta de interacao para confirmar a qualidade.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Criar rituais de comunidade como bairro da semana e vale o preco.",
        }),
      ],
      limitations: [
        "Qualidade da comunidade nao pode ser totalmente avaliada sem amostras de interacao.",
      ],
    },
    {
      dimension: "opportunities",
      status: "evaluated",
      proposed_score: 78,
      confidence: "high",
      evidences: [
        {
          evidence_type: "inferred",
          source_reference: "briefing",
          observed_area: "tema comercializavel",
          confidence: "high",
          limitations: [],
        },
      ],
      evidence_gaps: [],
      strengths: ["Audiencia local com tema comercializavel."],
      weaknesses: [],
      diagnosis:
        "O tema local e comercializavel e comporta uma superficie comercial mais profissional sem perder a voz.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Profissionalizar a superficie comercial sem alterar a voz editorial.",
        }),
      ],
      limitations: [
        "Nenhum historico de receita ou parceria fechada foi fornecido.",
      ],
    },
  ]),
  executive_summary:
    "O perfil tem identidade e conteudo fortes com voz local consistente, mas a superficie comercial ainda precisa de estrutura.",
  priorities: [
    "Criar pagina de parceria com criterios claros.",
    "Publicar criterios de curadoria.",
  ],
  opportunities: ["Profissionalizar a superficie comercial sem perder a voz."],
  action_plan_24h: ["Adicionar destaque Parcerias com contato direto."],
  action_plan_7d: ["Publicar post com os criterios de curadoria dos locais."],
  action_plan_30d: ["Criar pagina de midia kit com formatos e publico."],
  content_suggestions: ["Serie bairro da semana com criterios de avaliacao."],
  global_limitations: ["Nenhum historico de receita foi fornecido."],
  review_signals: [],
} satisfies AiDiagnosisOutput;
