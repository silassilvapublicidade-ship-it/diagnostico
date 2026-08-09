import { z } from "zod";

import {
  dimensionKeySchema,
  dimensionStatusSchema,
  type AnalysisCalculationInput,
  type DimensionAssessment,
  type EvidenceReference,
  type ProfileType,
} from "@/domain/methodology-8d";

import { AI_PROMPT_VERSION } from "./prompt";
import {
  aiRecommendationSchema,
  aiStrategicDiagnosisSchema,
  type AiDiagnosisOutput,
  type AiDimensionAssessment,
  type AiRecommendation,
  type AiStrategicDiagnosis,
} from "./output-schema";

const RECOMMENDATION_PRIORITY_ORDER: Record<
  AiRecommendation["priority"],
  number
> = {
  high: 0,
  medium: 1,
  low: 2,
};

function pickTopRecommendation(
  recommendations: AiRecommendation[],
): AiRecommendation | undefined {
  return [...recommendations].sort(
    (a, b) =>
      RECOMMENDATION_PRIORITY_ORDER[a.priority] -
      RECOMMENDATION_PRIORITY_ORDER[b.priority],
  )[0];
}

function formatRecommendation(
  recommendation: AiRecommendation,
  strategicDiagnosis: AiStrategicDiagnosis,
): string {
  return [
    recommendation.how_to_execute,
    `Exemplo aplicado: ${strategicDiagnosis.practical_example}`,
    `Primeiro passo: ${strategicDiagnosis.next_step}`,
    `(prioridade ${recommendation.priority}, esforco ${recommendation.effort}) — ${recommendation.why_it_matters}`,
  ].join(" ");
}

function mapDimension(dimension: AiDimensionAssessment): DimensionAssessment {
  const evidenceReferences: EvidenceReference[] = dimension.evidences.map(
    (evidence) => ({
      evidenceType: evidence.evidence_type,
      sourceReference: `${evidence.observed_area} — ${evidence.source_reference}`,
      confidence: evidence.confidence,
      limitations: evidence.limitations,
    }),
  );

  const topRecommendation = pickTopRecommendation(dimension.recommendations);
  const safeRecommendation = topRecommendation
    ? formatRecommendation(topRecommendation, dimension.strategic_diagnosis)
    : "Nenhuma recomendacao estruturada foi retornada para esta dimensao.";

  const base = {
    dimension: dimension.dimension,
    confidence: dimension.confidence,
    evidenceAvailable: dimension.evidences.map(
      (evidence) => evidence.source_reference,
    ),
    evidenceMissing: dimension.evidence_gaps,
    limitations: dimension.limitations,
    safeRecommendation,
    evidenceReferences,
  };

  if (dimension.status === "insufficient_evidence") {
    return { ...base, status: "insufficient_evidence" };
  }

  // The output schema's refine() guarantees proposed_score is non-null
  // whenever status is "evaluated" — a null score here would already have
  // made parsed_output null, which run-analysis.ts treats as a job failure
  // before this mapping ever runs.
  return { ...base, status: "evaluated", score: dimension.proposed_score! };
}

export function mapAiOutputToDomainInput(params: {
  output: AiDiagnosisOutput;
  profileType: ProfileType;
  modelProvider: string;
  modelName: string;
}): AnalysisCalculationInput {
  return {
    profileType: params.profileType,
    dimensions: params.output.dimensions.map(mapDimension),
    reviewSignals: params.output.review_signals,
    promptVersion: AI_PROMPT_VERSION,
    modelProvider: params.modelProvider,
    modelName: params.modelName,
    generatedAt: new Date().toISOString(),
  };
}

export const webPayloadDimensionSchema = z.object({
  dimension: dimensionKeySchema,
  status: dimensionStatusSchema,
  diagnosis: z.string(),
  strategicDiagnosis: aiStrategicDiagnosisSchema.optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(aiRecommendationSchema),
});

export const webPayloadSchema = z.object({
  executiveSummary: z.string(),
  priorities: z.array(z.string()),
  opportunities: z.array(z.string()),
  actionPlan24h: z.array(z.string()),
  actionPlan7d: z.array(z.string()),
  actionPlan30d: z.array(z.string()),
  contentSuggestions: z.array(z.string()),
  globalLimitations: z.array(z.string()),
  dimensions: z.array(webPayloadDimensionSchema),
});

export type WebPayloadDimension = {
  dimension: AiDimensionAssessment["dimension"];
  status: AiDimensionAssessment["status"];
  diagnosis: string;
  strategicDiagnosis: AiStrategicDiagnosis;
  strengths: string[];
  weaknesses: string[];
  recommendations: AiRecommendation[];
};

export type WebPayload = {
  executiveSummary: string;
  priorities: string[];
  opportunities: string[];
  actionPlan24h: string[];
  actionPlan7d: string[];
  actionPlan30d: string[];
  contentSuggestions: string[];
  globalLimitations: string[];
  dimensions: WebPayloadDimension[];
};

export function extractWebPayload(output: AiDiagnosisOutput): WebPayload {
  return {
    executiveSummary: output.executive_summary,
    priorities: output.priorities,
    opportunities: output.opportunities,
    actionPlan24h: output.action_plan_24h,
    actionPlan7d: output.action_plan_7d,
    actionPlan30d: output.action_plan_30d,
    contentSuggestions: output.content_suggestions,
    globalLimitations: output.global_limitations,
    dimensions: output.dimensions.map((dimension) => ({
      dimension: dimension.dimension,
      status: dimension.status,
      diagnosis: dimension.diagnosis,
      strategicDiagnosis: dimension.strategic_diagnosis,
      strengths: dimension.strengths,
      weaknesses: dimension.weaknesses,
      recommendations: dimension.recommendations,
    })),
  };
}
