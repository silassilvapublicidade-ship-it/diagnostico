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
    body: "O diagnóstico ainda não foi enviado.",
    tone: "neutral",
  },
  waiting_payment: {
    title: "Aguardando pagamento",
    body: "Confirme o pagamento para liberar a análise deste diagnóstico.",
    tone: "info",
  },
  waiting_briefing: {
    title: "Aguardando briefing",
    body: "Precisamos do contexto do perfil antes de qualquer leitura.",
    tone: "info",
  },
  waiting_assets: {
    title: "Aguardando evidências",
    body: "Envie imagens ou PDFs para compor o material da futura análise.",
    tone: "info",
  },
  ready: {
    title: "Pagamento confirmado",
    body: "Pronto para processar. Clique abaixo para gerar sua análise.",
    tone: "neutral",
  },
  processing: {
    title: "Processando",
    body: "A estrutura técnica está organizando o resultado inicial.",
    tone: "info",
  },
  requires_review: {
    title: "Precisa de revisão",
    body: "Há sinais que bloqueiam a entrega automática do resultado.",
    tone: "alert",
  },
  waiting_for_more_information: {
    title: "Precisa de mais informações",
    body: "A evidência disponível ainda não sustenta uma conclusão segura.",
    tone: "alert",
  },
  generating_report: {
    title: "Preparando visualização",
    body: "O resultado inicial está sendo preparado para leitura.",
    tone: "info",
  },
  completed: {
    title: "Concluído",
    body: "O diagnóstico inicial está disponível.",
    tone: "done",
  },
  failed: {
    title: "Falhou",
    body: "Não foi possível concluir o processamento.",
    tone: "alert",
  },
};

export const CLASSIFICATION_COPY: Record<ScoreClassification, string> = {
  critical: "Crítico",
  attention: "Atenção",
  development: "Em desenvolvimento",
  consistent: "Consistente",
  reference: "Referência",
};

export const CONFIDENCE_COPY: Record<ConfidenceLevel, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
