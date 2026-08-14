import type { DimensionKey, ReviewReason } from "@/domain/methodology-8d";

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  positioning: "Posicionamento",
  first_impression: "Primeira Impressão",
  authority: "Autoridade",
  content: "Conteúdo",
  identity: "Identidade",
  conversion: "Conversão",
  relationship: "Relacionamento",
  opportunities: "Oportunidades",
};

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  fewer_than_5_evaluable_dimensions:
    "Evidências insuficientes para avaliar a maior parte das dimensões",
  low_global_confidence_on_critical_analysis:
    "Confiança baixa em uma leitura ainda incompleta",
  sensitive_content: "Conteúdo sensível identificado",
  reputational_risk: "Risco reputacional identificado",
  privacy_risk: "Risco de privacidade identificado",
  harmful_commercial_recommendation_risk:
    "Recomendação comercial que exige cuidado adicional",
  structural_validation_failed: "Inconsistência estrutural na leitura",
  relevant_briefing_evidence_conflict:
    "O briefing e as evidências enviadas não coincidem totalmente",
  unreadable_central_image: "Uma imagem central não pode ser lida com clareza",
  missing_metric_inference_risk:
    "Alguma métrica citada depende de inferência, não de dado enviado",
  strong_ambiguity: "Ambiguidade forte em parte da leitura",
  incomplete_briefing: "O briefing enviado ficou incompleto ou inconsistente",
  unclear_bio_link: "O destino do link da bio não ficou claro",
  no_relationship_evidence: "Não havia evidência de interação com a audiência",
};
