import { z } from "zod";

import { profileTypeSchema } from "@/domain/methodology-8d";

const optionalText = z.string().trim().optional().or(z.literal(""));
const urlList = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  );

const baseBriefingSchema = z.object({
  profileType: profileTypeSchema,
  instagramUrl: z.string().trim().url("Informe uma URL valida do perfil."),
  mainObjective: z.string().trim().min(8, "Descreva o objetivo principal."),
  mainDifficulty: z.string().trim().min(8, "Descreva a dificuldade atual."),
  desiredCta: z.string().trim().min(3, "Informe a acao desejada."),
  links: urlList,
  reputationRestrictions: optionalText,
  additionalNotes: optionalText,
});

export const businessBriefingSchema = baseBriefingSchema.extend({
  profileType: z.literal("business"),
  segment: z.string().trim().min(2, "Informe o segmento."),
  mainOffer: z.string().trim().min(3, "Informe a oferta principal."),
  targetAudience: z.string().trim().min(3, "Informe o publico."),
  differentiators: z.string().trim().min(3, "Informe os diferenciais."),
  authorityProofs: z
    .string()
    .trim()
    .min(3, "Informe provas, autoridade ou lacunas dessa dimensao."),
  currentContext: z.string().trim().min(8, "Explique o contexto atual."),
});

export const creatorBriefingSchema = baseBriefingSchema.extend({
  profileType: z.literal("creator"),
  niche: z.string().trim().min(2, "Informe o nicho."),
  contentTerritory: z
    .string()
    .trim()
    .min(3, "Informe o territorio de conteudo."),
  desiredAudience: z.string().trim().min(3, "Informe o publico desejado."),
  formats: z.string().trim().min(3, "Informe os formatos principais."),
  desiredPartnerships: z
    .string()
    .trim()
    .min(3, "Informe marcas ou parcerias desejadas."),
  perceivedIdentity: z
    .string()
    .trim()
    .min(3, "Descreva a identidade percebida."),
  exposureLimits: optionalText,
});

export const diagnosisBriefingSchema = z.discriminatedUnion("profileType", [
  businessBriefingSchema,
  creatorBriefingSchema,
]);

export const consentSchema = z.object({
  processingConsent: z.literal("on", {
    error: "O consentimento de processamento e obrigatorio.",
  }),
});

export type BusinessBriefing = z.infer<typeof businessBriefingSchema>;
export type CreatorBriefing = z.infer<typeof creatorBriefingSchema>;
export type DiagnosisBriefing = z.infer<typeof diagnosisBriefingSchema>;

export function parseBriefingForm(formData: FormData): DiagnosisBriefing {
  const raw = Object.fromEntries(formData.entries());
  return diagnosisBriefingSchema.parse(raw);
}

export function parseProcessingConsent(formData: FormData): void {
  consentSchema.parse({
    processingConsent: formData.get("processingConsent"),
  });
}

export function toAnswerRows(briefing: DiagnosisBriefing) {
  return Object.entries(briefing)
    .filter(([key]) => key !== "profileType" && key !== "instagramUrl")
    .map(([questionKey, answer]) => ({
      question_key: questionKey,
      answer,
    }));
}
