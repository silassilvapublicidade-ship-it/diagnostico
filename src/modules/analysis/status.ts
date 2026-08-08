import type {
  AnalysisStatus,
  ConfidenceLevel,
  ScoreClassification,
} from "@/domain/methodology-8d";

export const STATUS_COPY: Record<
  AnalysisStatus,
  { title: string; body: string; tone: "neutral" | "info" | "alert" | "done" }
> = {
  draft: {
    title: "Rascunho",
    body: "O diagnostico ainda nao foi enviado.",
    tone: "neutral",
  },
  waiting_payment: {
    title: "Aguardando liberacao",
    body: "O pagamento ainda nao faz parte desta fase.",
    tone: "info",
  },
  waiting_briefing: {
    title: "Aguardando briefing",
    body: "Precisamos do contexto do perfil antes de qualquer leitura.",
    tone: "info",
  },
  waiting_assets: {
    title: "Aguardando evidencias",
    body: "Envie imagens ou PDFs para compor o material da futura analise.",
    tone: "info",
  },
  ready: {
    title: "Pronto para processamento",
    body: "O material foi recebido e esta pronto para a proxima etapa.",
    tone: "neutral",
  },
  processing: {
    title: "Processando",
    body: "A estrutura tecnica esta organizando o resultado inicial.",
    tone: "info",
  },
  requires_review: {
    title: "Precisa de revisao",
    body: "Ha sinais que bloqueiam a entrega automatica do resultado.",
    tone: "alert",
  },
  waiting_for_more_information: {
    title: "Precisa de mais informacoes",
    body: "A evidencia disponivel ainda nao sustenta uma conclusao segura.",
    tone: "alert",
  },
  generating_report: {
    title: "Preparando visualizacao",
    body: "O resultado inicial esta sendo preparado para leitura.",
    tone: "info",
  },
  completed: {
    title: "Concluido",
    body: "O diagnostico inicial esta disponivel.",
    tone: "done",
  },
  failed: {
    title: "Falhou",
    body: "Nao foi possivel concluir o processamento.",
    tone: "alert",
  },
};

export const CLASSIFICATION_COPY: Record<ScoreClassification, string> = {
  critical: "Critico",
  attention: "Atencao",
  development: "Em desenvolvimento",
  consistent: "Consistente",
  reference: "Referencia",
};

export const CONFIDENCE_COPY: Record<ConfidenceLevel, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};
