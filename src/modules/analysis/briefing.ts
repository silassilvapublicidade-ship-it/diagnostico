import { z } from "zod";

import { profileTypeSchema } from "@/domain/methodology-8d";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const diagnosisBriefingSchema = z.object({
  profileType: profileTypeSchema,
  instagramUrl: z.string().trim().url("Informe uma URL valida do perfil."),
  niche: z.string().trim().min(2, "Conte rapidamente o que voce faz."),
  mainObjective: z
    .array(z.string().trim().min(1))
    .min(1, "Selecione ao menos um objetivo."),
  mainDifficulty: z
    .array(z.string().trim().min(1))
    .min(1, "Selecione ao menos uma dificuldade."),
  additionalNotes: optionalText,
});

export const consentSchema = z.object({
  processingConsent: z.literal("on", {
    error: "O consentimento de processamento e obrigatorio.",
  }),
});

export type DiagnosisBriefing = z.infer<typeof diagnosisBriefingSchema>;

export function parseBriefingForm(formData: FormData): DiagnosisBriefing {
  return diagnosisBriefingSchema.parse({
    profileType: formData.get("profileType"),
    instagramUrl: formData.get("instagramUrl"),
    niche: formData.get("niche"),
    mainObjective: formData.getAll("mainObjective"),
    mainDifficulty: formData.getAll("mainDifficulty"),
    additionalNotes: formData.get("additionalNotes") ?? undefined,
  });
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
