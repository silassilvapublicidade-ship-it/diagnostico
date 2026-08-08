import type { DimensionKey, ReviewReason } from "@/domain/methodology-8d";

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  positioning: "Posicionamento",
  first_impression: "Primeira Impressao",
  authority: "Autoridade",
  content: "Conteudo",
  identity: "Identidade",
  conversion: "Conversao",
  relationship: "Relacionamento",
  opportunities: "Oportunidades",
};

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  fewer_than_5_evaluable_dimensions:
    "Evidencias insuficientes para avaliar a maior parte das dimensoes",
  low_global_confidence_on_critical_analysis:
    "Confianca baixa em uma leitura ainda incompleta",
  sensitive_content: "Conteudo sensivel identificado",
  reputational_risk: "Risco reputacional identificado",
  privacy_risk: "Risco de privacidade identificado",
  harmful_commercial_recommendation_risk:
    "Recomendacao comercial que exige cuidado adicional",
  structural_validation_failed: "Inconsistencia estrutural na leitura",
  relevant_briefing_evidence_conflict:
    "O briefing e as evidencias enviadas nao coincidem totalmente",
  unreadable_central_image: "Uma imagem central nao pode ser lida com clareza",
  missing_metric_inference_risk:
    "Alguma metrica citada depende de inferencia, nao de dado enviado",
  strong_ambiguity: "Ambiguidade forte em parte da leitura",
  incomplete_briefing: "O briefing enviado ficou incompleto ou inconsistente",
  unclear_bio_link: "O destino do link da bio nao ficou claro",
  no_relationship_evidence: "Nao havia evidencia de interacao com a audiencia",
};
