import type { AiDiagnosisOutput } from "../../src/modules/ai/output-schema";

function recommendation(
  overrides: Partial<
    AiDiagnosisOutput["dimensions"][number]["recommendations"][number]
  >,
): AiDiagnosisOutput["dimensions"][number]["recommendations"][number] {
  return {
    what_was_identified: "Evidencia parcial ou ausente para esta dimensao.",
    why_it_matters:
      "Sem mais evidencia, a leitura fica limitada a uma hipotese inicial.",
    how_to_execute:
      "Enviar as evidencias indicadas para uma leitura mais completa.",
    priority: "medium",
    effort: "low",
    expected_impact:
      "Permite uma leitura mais confiavel, sem garantia de resultado.",
    supporting_evidence: "Evidencia parcial enviada.",
    ...overrides,
  };
}

export const aiOutputCreatorLowEvidence = {
  dimensions: [
    {
      dimension: "positioning",
      status: "evaluated",
      proposed_score: 38,
      confidence: "low",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "bio parcial",
          confidence: "low",
          limitations: ["Briefing incompleto."],
        },
      ],
      evidence_gaps: ["publico", "territorio", "objetivo especifico"],
      strengths: [],
      weaknesses: ["Linguagem generica."],
      diagnosis:
        "O posicionamento so pode ser avaliado como clareza inicial, sem território definido.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Substituir a linguagem generica por um territorio reconhecivel, como achados locais acessiveis.",
        }),
      ],
      limitations: [
        "Posicionamento pode ser avaliado apenas como clareza inicial.",
      ],
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      proposed_score: 44,
      confidence: "medium",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "profile_top",
          observed_area: "topo do perfil",
          confidence: "medium",
          limitations: [],
        },
      ],
      evidence_gaps: ["destaques", "posts fixados", "destino do link"],
      strengths: [],
      weaknesses: ["Jornada completa do visitante nao pode ser avaliada."],
      diagnosis:
        "A primeira tela nao deixa claro quem deveria seguir o perfil e por que.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Deixar claro na primeira tela quem deveria seguir o perfil e por que.",
        }),
      ],
      limitations: ["A jornada completa do visitante nao pode ser avaliada."],
    },
    {
      dimension: "authority",
      status: "insufficient_evidence",
      proposed_score: null,
      confidence: "low",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "amostra parcial do feed",
          confidence: "low",
          limitations: ["Amostra muito pequena."],
        },
      ],
      evidence_gaps: [
        "reconhecimento",
        "criterios",
        "colaboracoes",
        "prova de repertorio",
      ],
      strengths: [],
      weaknesses: [],
      diagnosis:
        "Nao ha evidencia suficiente para avaliar autoridade a partir de uma amostra parcial do feed.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Enviar posts representativos, comentarios, colaboracoes ou criterios que demonstrem repertorio.",
        }),
      ],
      limitations: [
        "Autoridade nao pode ser afirmada a partir de uma amostra parcial pequena.",
      ],
    },
    {
      dimension: "content",
      status: "evaluated",
      proposed_score: 46,
      confidence: "low",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "feed parcial com 9 posts",
          confidence: "low",
          limitations: [],
        },
      ],
      evidence_gaps: ["feed completo", "legendas", "performance", "frequencia"],
      strengths: [],
      weaknesses: ["Consistencia e retencao nao podem ser inferidas."],
      diagnosis:
        "Os temas visiveis sugerem um caminho, mas consistencia e retencao nao podem ser inferidas.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Organizar os temas visiveis em tres formatos recorrentes antes de aumentar o volume.",
        }),
      ],
      limitations: [
        "Consistencia e retencao nao podem ser inferidas com a amostra atual.",
      ],
    },
    {
      dimension: "identity",
      status: "evaluated",
      proposed_score: 52,
      confidence: "low",
      evidences: [
        {
          evidence_type: "visual",
          source_reference: "feed",
          observed_area: "amostra visual pequena",
          confidence: "low",
          limitations: [],
        },
      ],
      evidence_gaps: [
        "stories",
        "legendas",
        "simbolos recorrentes",
        "linguagem assinatura",
      ],
      strengths: [],
      weaknesses: [],
      diagnosis:
        "Ha um tom de bio reconhecivel, mas a memorabilidade nao pode ser confirmada com a amostra atual.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Definir um padrao de linguagem ou formato recorrente que possa ser reconhecido entre posts.",
        }),
      ],
      limitations: [
        "Memorabilidade nao pode ser afirmada com esta amostra de evidencia.",
      ],
    },
    {
      dimension: "conversion",
      status: "insufficient_evidence",
      proposed_score: null,
      confidence: "low",
      evidences: [
        {
          evidence_type: "declared",
          source_reference: "bio",
          observed_area: "mencao a um link",
          confidence: "low",
          limitations: [],
        },
      ],
      evidence_gaps: [
        "destino do link",
        "media kit",
        "CTA",
        "objetivo de parceria",
      ],
      strengths: [],
      weaknesses: [],
      diagnosis:
        "Sem o destino do link, a prontidao comercial nao pode ser avaliada.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Enviar o destino do link e esclarecer o proximo passo desejado para audiencia e marcas.",
        }),
      ],
      limitations: [
        "Prontidao comercial nao pode ser avaliada sem o destino do link.",
      ],
    },
    {
      dimension: "relationship",
      status: "insufficient_evidence",
      proposed_score: null,
      confidence: "low",
      evidences: [],
      evidence_gaps: [
        "comentarios",
        "DMs",
        "respostas em stories",
        "insights",
        "enquetes",
      ],
      strengths: [],
      weaknesses: [],
      diagnosis:
        "Sem nenhuma evidencia de interacao, a qualidade do relacionamento nao pode ser avaliada.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Enviar comentarios, respostas de stories, resultados de enquetes ou prints de insights para avaliar a comunidade.",
        }),
      ],
      limitations: [
        "Qualidade do relacionamento nao pode ser avaliada sem evidencia de interacao.",
      ],
    },
    {
      dimension: "opportunities",
      status: "insufficient_evidence",
      proposed_score: null,
      confidence: "low",
      evidences: [
        {
          evidence_type: "inferred",
          source_reference: "briefing",
          observed_area: "tema amplo de estilo de vida",
          confidence: "low",
          limitations: [],
        },
      ],
      evidence_gaps: [
        "publico",
        "marcas alvo",
        "metricas",
        "diferenciacao",
        "caminhos comerciais",
      ],
      strengths: [],
      weaknesses: [],
      diagnosis:
        "Priorizar oportunidades aqui exigiria inferencia sem suporte suficiente de evidencia.",
      recommendations: [
        recommendation({
          how_to_execute:
            "Completar o briefing com publico, marcas desejadas, formatos e limites editoriais.",
        }),
      ],
      limitations: [
        "Oportunidades priorizadas exigiriam inferencia sem suporte.",
      ],
    },
  ],
  executive_summary:
    "O briefing e as evidencias enviadas ainda nao sustentam uma leitura completa e confiavel do perfil.",
  priorities: [
    "Completar o briefing.",
    "Enviar evidencias de interacao e do link da bio.",
  ],
  opportunities: [],
  action_plan_24h: ["Enviar o destino real do link da bio."],
  action_plan_7d: ["Enviar prints de comentarios, DMs ou insights."],
  action_plan_30d: [
    "Reenviar a analise apos completar o briefing e as evidencias.",
  ],
  content_suggestions: [],
  global_limitations: [
    "Briefing incompleto.",
    "Ambiguidade forte em varias dimensoes.",
    "Risco de inferencia de metricas nao enviadas.",
  ],
  review_signals: [
    "incomplete_briefing",
    "unclear_bio_link",
    "no_relationship_evidence",
    "strong_ambiguity",
    "missing_metric_inference_risk",
  ],
} satisfies AiDiagnosisOutput;
