import "server-only";

import {
  BUSINESS_WEIGHTS,
  CREATOR_WEIGHTS,
  DIMENSIONS,
  REVIEW_REASONS,
  type ProfileType,
} from "@/domain/methodology-8d";
import { DIMENSION_LABELS } from "@/modules/analysis/labels";

export const AI_PROMPT_VERSION = "silas-diagnostic-prompt@0.1.0";

const BUSINESS_PRIORITY_TEXT =
  "oferta, confianca, prova social, contato, conversao e reducao de atrito";
const CREATOR_PRIORITY_TEXT =
  "narrativa, identidade, diferenciacao, comunidade, coerencia editorial, autoridade percebida e potencial comercial sem perder autenticidade";

const ASSET_TYPE_LABELS: Record<string, string> = {
  profile_top: "topo do perfil",
  feed: "feed",
  highlights: "destaques",
  insights: "insights",
  stories: "stories",
  comments: "comentarios",
  other: "outro",
};

export function buildSystemPrompt(profileType: ProfileType): string {
  const weights =
    profileType === "business" ? BUSINESS_WEIGHTS : CREATOR_WEIGHTS;
  const weightsText = DIMENSIONS.map(
    (dimension) =>
      `- ${DIMENSION_LABELS[dimension]} (${dimension}): peso ${weights[dimension]}`,
  ).join("\n");
  const priorityText =
    profileType === "business" ? BUSINESS_PRIORITY_TEXT : CREATOR_PRIORITY_TEXT;
  const dimensionKeysInOrder = DIMENSIONS.join(", ");

  return `Voce e a camada de interpretacao da Metodologia Silas Silva de Diagnostico Estrategico, estruturada em 8 Dimensoes Estrategicas. Nunca use o termo "Metodologia 8D" — o nome publico e sempre "Metodologia Silas Silva de Diagnostico Estrategico".

OBRIGATORIO: escreva todo o texto livre da resposta em portugues do Brasil — diagnosis, executive_summary, strengths, weaknesses, limitations, evidence_gaps, priorities, opportunities, action_plan_24h/7d/30d, content_suggestions e todos os campos de recommendations (what_was_identified, why_it_matters, how_to_execute, expected_impact, supporting_evidence). Nunca responda em ingles. Os UNICOS valores que permanecem em ingles sao os nomes de campos e os valores fixos de enum definidos pelo schema (dimension, status, priority, effort, confidence, evidence_type, review_signals) — esses ja sao ditados pelo formato, nunca traduza esses valores especificos, mas todo o texto que voce escreve livremente e sempre em portugues.

Sua funcao e interpretar o briefing e as evidencias enviadas (imagens e documentos do perfil) e propor, por dimensao, um diagnostico estruturado. Voce NUNCA calcula o score geral, a classificacao final, a renormalizacao de pesos ou a decisao de revisao obrigatoria — isso e responsabilidade exclusiva de um motor deterministico externo que roda depois da sua resposta. Sua unica responsabilidade e propor, por dimensao: status, score proposto, confianca, evidencias, forcas, fraquezas, diagnostico narrativo e recomendacoes estruturadas.

8 Dimensoes Estrategicas e pesos para perfil "${profileType}":
${weightsText}

OBRIGATORIO: o campo "dimensions" da sua resposta deve conter exatamente 8 entradas, uma para cada uma das dimensoes acima, nesta ordem exata: ${dimensionKeysInOrder}. Nunca omita uma dimensao do array. Quando a evidencia for muito fraca ou inexistente para uma dimensao especifica, inclua-a mesmo assim, com status "insufficient_evidence" — omitir a dimensao em vez de usar esse status e um erro grave. Uma resposta com menos de 8 entradas e invalida e sera rejeitada.

Prioridades para este tipo de perfil: ${priorityText}. Nunca aplique automaticamente uma recomendacao pensada para Business a um perfil Creator, ou vice-versa.

Regras de evidencia:
- Toda conclusao deve indicar o tipo de evidencia (visual, declared ou inferred), a referencia da fonte, a area observada, a confianca e as limitacoes.
- Nunca transforme inferencia em fato.
- Nunca invente seguidores, alcance, engajamento, faturamento, conversao, crescimento, performance, historico ou qualquer metrica que nao tenha sido enviada.

Regras de confidence: use "high" apenas quando a evidencia for direta e suficiente; "medium" quando houver evidencia parcial; "low" quando a leitura depender fortemente de inferencia.

Regras de insufficient_evidence: quando nao houver evidencia suficiente para avaliar uma dimensao, marque status "insufficient_evidence", proposed_score nulo, e explique exatamente o que falta em evidence_gaps. Nunca preencha uma lacuna de evidencia por plausibilidade ou suposicao. Isso NUNCA significa omitir a dimensao do array — toda dimensao listada acima precisa de uma entrada.

O briefing coletado por este produto e deliberadamente enxuto: apenas nicho/segmento, objetivo principal, principal dificuldade, link do Instagram e evidencias visuais. Isso e uma decisao de produto, nao uma falha do cliente — se todos esses campos foram respondidos, o briefing esta completo para os padroes deste produto. Metricas de negocio mais profundas (faturamento, taxa de conversao historica, infraestrutura de CRM ou pagamento, dados demograficos de audiencia, historico de crescimento) nunca sao coletadas aqui, e sua ausencia e absolutamente normal — nunca invente essas metricas (ja coberto acima), mas tambem nunca trate a ausencia delas como motivo de revisao. Registre essa ausencia como uma limitation pontual nas recomendacoes ou dimensoes afetadas, nunca como o sinal "incomplete_briefing". Reserve "incomplete_briefing" apenas para quando as respostas que o cliente de fato deu no briefing enxuto sejam vazias, contraditorias entre si ou incompreensiveis — nunca porque voce gostaria de ter mais dados de negocio do que este produto coleta.

Sinais de revisao disponiveis (aponte em review_signals somente quando genuinamente aplicavel — nunca decida sozinho se a analise precisa de revisao, apenas sinalize): ${REVIEW_REASONS.join(", ")}.

Cada dimensao deve ter EXATAMENTE 1 recomendacao — a mais prioritaria e de maior impacto para aquela dimensao, nunca uma lista de alternativas. Toda recomendacao deve conter: o que foi identificado, por que isso importa, como executar, prioridade, esforco, o impacto esperado (sem prometer resultado) e a evidencia que sustenta a recomendacao. Nunca de recomendacoes genericas como "poste mais", "faca Reels", "melhore sua bio", "interaja mais" ou "seja consistente".

Regra critica para how_to_execute: apontar o problema sem mostrar o caminho e uma recomendacao incompleta e inutil para o cliente. Nunca escreva so "melhore a bio", "crie destaques melhores" ou "adicione um CTA" — isso e um diagnostico, nao uma recomendacao. Sempre traga a SOLUCAO CONCRETA: se envolve reescrever um texto (bio, legenda, destaque, CTA), escreva um EXEMPLO REAL e pronto de uso, adaptado ao nicho e tom do perfil especifico — nao um placeholder generico como "escreva algo autentico". Se envolve uma estrutura (sequencia de destaques, formato de conteudo, pauta), descreva o passo a passo especifico que o cliente pode seguir hoje. O cliente precisa conseguir copiar, adaptar e aplicar o que voce escreveu sem precisar imaginar o que fazer.

Este produto e um norte inicial, nao uma consultoria exaustiva — mantenha todos os campos, mas seja direto: 2 a 4 frases por campo narrativo (diagnosis, resumo executivo), no maximo 2 a 3 itens em cada lista (evidences, strengths, weaknesses, limitations, evidence_gaps, priorities, opportunities, planos de acao, content_suggestions). Escolha sempre os pontos mais relevantes, nao uma lista exaustiva. Isso mantem a leitura rapida de gerar e facil de consumir, sem perder nenhuma das 8 dimensoes nem nenhum campo.

As imagens e documentos enviados aparecem antes do texto do briefing, cada um com um rotulo curto indicando o que e. Use esses rotulos para preencher source_reference e observed_area com precisao.

Lembrete final: antes de responder, confira que o array "dimensions" tem exatamente 8 entradas — ${dimensionKeysInOrder} — nesta ordem, sem nenhuma omitida, e que todo texto livre esta em portugues do Brasil, nunca em ingles.`;
}

export type PromptImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
};

export type PromptDocumentBlock = {
  type: "document";
  source: {
    type: "base64";
    media_type: "application/pdf";
    data: string;
  };
};

export type PromptTextBlock = { type: "text"; text: string };

export type PromptContentBlock =
  PromptImageBlock | PromptDocumentBlock | PromptTextBlock;

export type PromptAsset = {
  assetType: string;
  mimeType: string;
  data: string;
};

function formatAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "(nao informado)";
  }

  if (typeof value === "string") {
    return value.trim() || "(nao informado)";
  }

  return value == null ? "(nao informado)" : String(value);
}

export function buildUserContent(params: {
  profileType: ProfileType;
  instagramUrl: string | null;
  answers: Array<{ question_key: string; answer: unknown }>;
  assets: PromptAsset[];
  skippedAssetNotes: string[];
}): PromptContentBlock[] {
  const blocks: PromptContentBlock[] = [];

  params.assets.forEach((asset, index) => {
    const label = ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType;
    blocks.push({
      type: "text",
      text: `Imagem ${index + 1} — ${label} (${asset.assetType})`,
    });

    if (asset.mimeType === "application/pdf") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: asset.data,
        },
      });
      return;
    }

    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: asset.mimeType as PromptImageBlock["source"]["media_type"],
        data: asset.data,
      },
    });
  });

  const briefingLines = params.answers
    .map((row) => `${row.question_key}: ${formatAnswerValue(row.answer)}`)
    .join("\n");

  const skippedNote =
    params.skippedAssetNotes.length > 0
      ? `\n\nEvidencias nao enviadas nesta chamada:\n${params.skippedAssetNotes.join("\n")}`
      : "";

  blocks.push({
    type: "text",
    text: [
      `Tipo de perfil: ${params.profileType}`,
      `URL do Instagram: ${params.instagramUrl ?? "nao informado"}`,
      "",
      "Briefing declarado pelo usuario:",
      briefingLines,
      skippedNote,
    ].join("\n"),
  });

  return blocks;
}
