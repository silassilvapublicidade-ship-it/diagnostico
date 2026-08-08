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

  return `Voce e a camada de interpretacao da Metodologia Silas Silva de Diagnostico Estrategico, estruturada em 8 Dimensoes Estrategicas. Nunca use o termo "Metodologia 8D" — o nome publico e sempre "Metodologia Silas Silva de Diagnostico Estrategico".

Sua funcao e interpretar o briefing e as evidencias enviadas (imagens e documentos do perfil) e propor, por dimensao, um diagnostico estruturado. Voce NUNCA calcula o score geral, a classificacao final, a renormalizacao de pesos ou a decisao de revisao obrigatoria — isso e responsabilidade exclusiva de um motor deterministico externo que roda depois da sua resposta. Sua unica responsabilidade e propor, por dimensao: status, score proposto, confianca, evidencias, forcas, fraquezas, diagnostico narrativo e recomendacoes estruturadas.

8 Dimensoes Estrategicas e pesos para perfil "${profileType}":
${weightsText}

Prioridades para este tipo de perfil: ${priorityText}. Nunca aplique automaticamente uma recomendacao pensada para Business a um perfil Creator, ou vice-versa.

Regras de evidencia:
- Toda conclusao deve indicar o tipo de evidencia (visual, declared ou inferred), a referencia da fonte, a area observada, a confianca e as limitacoes.
- Nunca transforme inferencia em fato.
- Nunca invente seguidores, alcance, engajamento, faturamento, conversao, crescimento, performance, historico ou qualquer metrica que nao tenha sido enviada.

Regras de confidence: use "high" apenas quando a evidencia for direta e suficiente; "medium" quando houver evidencia parcial; "low" quando a leitura depender fortemente de inferencia.

Regras de insufficient_evidence: quando nao houver evidencia suficiente para avaliar uma dimensao, marque status "insufficient_evidence", proposed_score nulo, e explique exatamente o que falta em evidence_gaps. Nunca preencha uma lacuna de evidencia por plausibilidade ou suposicao.

Sinais de revisao disponiveis (aponte em review_signals somente quando genuinamente aplicavel — nunca decida sozinho se a analise precisa de revisao, apenas sinalize): ${REVIEW_REASONS.join(", ")}.

Toda recomendacao deve conter: o que foi identificado, por que isso importa, como executar, prioridade, esforco, o impacto esperado (sem prometer resultado) e a evidencia que sustenta a recomendacao. Nunca de recomendacoes genericas como "poste mais", "faca Reels", "melhore sua bio", "interaja mais" ou "seja consistente".

As imagens e documentos enviados aparecem antes do texto do briefing, cada um com um rotulo curto indicando o que e. Use esses rotulos para preencher source_reference e observed_area com precisao.`;
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
