export type ProfileType = "business" | "creator";

export type DimensionKey =
  | "positioning"
  | "first_impression"
  | "authority"
  | "content"
  | "identity"
  | "conversion"
  | "relationship"
  | "opportunities";

export type DimensionStatus = "evaluated" | "insufficient_evidence";

export type ConfidenceLevel = "high" | "medium" | "low";

export type EvidenceType = "visual" | "declared" | "inferred";

export type ScoreClassification =
  "critical" | "attention" | "development" | "consistent" | "reference";

export type ScoreKind = "complete" | "partial";

export type AnalysisStatus =
  | "draft"
  | "waiting_payment"
  | "waiting_briefing"
  | "waiting_assets"
  | "ready"
  | "processing"
  | "requires_review"
  | "waiting_for_more_information"
  | "generating_report"
  | "completed"
  | "failed";

export type ReviewReason =
  | "fewer_than_5_evaluable_dimensions"
  | "relevant_briefing_evidence_conflict"
  | "unreadable_central_image"
  | "sensitive_content"
  | "reputational_risk"
  | "privacy_risk"
  | "missing_metric_inference_risk"
  | "strong_ambiguity"
  | "harmful_commercial_recommendation_risk"
  | "structural_validation_failed"
  | "low_global_confidence_on_critical_analysis"
  | "incomplete_briefing"
  | "unclear_bio_link"
  | "no_relationship_evidence";

export type EvidenceReference = {
  evidenceType: EvidenceType;
  sourceReference: string;
  confidence: ConfidenceLevel;
  limitations: string[];
};

type BaseDimensionAssessment = {
  dimension: DimensionKey;
  confidence: ConfidenceLevel;
  evidenceAvailable: string[];
  evidenceMissing: string[];
  limitations: string[];
  safeRecommendation: string;
  evidenceReferences?: EvidenceReference[];
};

export type EvaluatedDimensionAssessment = BaseDimensionAssessment & {
  status: "evaluated";
  score: number;
};

export type InsufficientEvidenceDimensionAssessment =
  BaseDimensionAssessment & {
    status: "insufficient_evidence";
    score?: never;
  };

export type DimensionAssessment =
  EvaluatedDimensionAssessment | InsufficientEvidenceDimensionAssessment;

export type WeightsSnapshot = Record<DimensionKey, number>;

export type DimensionScoreOutput = {
  dimension: DimensionKey;
  status: DimensionStatus;
  score?: number;
  classification?: ScoreClassification;
  confidence: ConfidenceLevel;
  originalWeight: number;
  effectiveWeight: number;
  evidenceAvailable: string[];
  evidenceMissing: string[];
  limitations: string[];
  safeRecommendation: string;
};

export type AnalysisCalculationInput = {
  profileType: ProfileType;
  dimensions: DimensionAssessment[];
  reviewSignals?: ReviewReason[];
  methodologyVersion?: string;
  promptVersion?: string;
  scoringVersion?: string;
  resultVersion?: string;
  modelProvider?: string;
  modelName?: string;
  generatedAt?: string;
};

export type AnalysisCalculationResult = {
  profileType: ProfileType;
  scoreKind: ScoreKind;
  score: number;
  classification: ScoreClassification;
  confidence: ConfidenceLevel;
  requiresReview: boolean;
  reviewReasons: ReviewReason[];
  includedDimensions: DimensionKey[];
  excludedDimensions: DimensionKey[];
  weightsSnapshot: WeightsSnapshot;
  dimensionScores: DimensionScoreOutput[];
  methodologyVersion: string;
  promptVersion: string;
  scoringVersion: string;
  resultVersion: string;
  modelProvider: string;
  modelName: string;
  generatedAt: string;
};
