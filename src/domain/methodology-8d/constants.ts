import type {
  AnalysisStatus,
  ConfidenceLevel,
  DimensionKey,
  DimensionStatus,
  EvidenceType,
  ProfileType,
  ReviewReason,
  ScoreClassification,
  WeightsSnapshot,
} from "./types";

export const METHODOLOGY_VERSION = "methodology-8d@0.1.0";
export const PROMPT_VERSION = "prompt-not-integrated@0.1.0";
export const SCORING_VERSION = "scoring-8d@0.1.0";
export const RESULT_VERSION = "analysis-result@0.1.0";
export const DEFAULT_MODEL_PROVIDER = "not_integrated";
export const DEFAULT_MODEL_NAME = "deterministic-fixture";

export const PROFILE_TYPES = [
  "business",
  "creator",
] as const satisfies readonly ProfileType[];

export const DIMENSIONS = [
  "positioning",
  "first_impression",
  "authority",
  "content",
  "identity",
  "conversion",
  "relationship",
  "opportunities",
] as const satisfies readonly DimensionKey[];

export const DIMENSION_STATUSES = [
  "evaluated",
  "insufficient_evidence",
] as const satisfies readonly DimensionStatus[];

export const CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
] as const satisfies readonly ConfidenceLevel[];

export const EVIDENCE_TYPES = [
  "visual",
  "declared",
  "inferred",
] as const satisfies readonly EvidenceType[];

export const SCORE_CLASSIFICATIONS = [
  "critical",
  "attention",
  "development",
  "consistent",
  "reference",
] as const satisfies readonly ScoreClassification[];

export const ANALYSIS_STATUSES = [
  "draft",
  "waiting_payment",
  "waiting_briefing",
  "waiting_assets",
  "ready",
  "processing",
  "requires_review",
  "waiting_for_more_information",
  "generating_report",
  "completed",
  "failed",
] as const satisfies readonly AnalysisStatus[];

export const REVIEW_REASONS = [
  "fewer_than_5_evaluable_dimensions",
  "relevant_briefing_evidence_conflict",
  "unreadable_central_image",
  "sensitive_content",
  "reputational_risk",
  "privacy_risk",
  "missing_metric_inference_risk",
  "strong_ambiguity",
  "harmful_commercial_recommendation_risk",
  "structural_validation_failed",
  "low_global_confidence_on_critical_analysis",
  "incomplete_briefing",
  "unclear_bio_link",
  "no_relationship_evidence",
] as const satisfies readonly ReviewReason[];

// Reasons serious enough to hold delivery for a human to look before the
// customer sees anything: structural data insufficiency (too few evaluable
// dimensions, low confidence across an incomplete read) and AI-signaled
// safety/harm concerns (sensitive content, reputational or privacy risk, a
// commercial recommendation that could cause real harm, or the AI's own
// output failing structural validation). Every other reason describes a
// normal limitation of a lightweight directional read, not a reason to
// block delivery — see detectRequiresReview in review.ts.
export const BLOCKING_REVIEW_REASONS = [
  "fewer_than_5_evaluable_dimensions",
  "low_global_confidence_on_critical_analysis",
  "sensitive_content",
  "reputational_risk",
  "privacy_risk",
  "harmful_commercial_recommendation_risk",
  "structural_validation_failed",
] as const satisfies readonly ReviewReason[];

export const BUSINESS_WEIGHTS = {
  positioning: 16,
  first_impression: 14,
  authority: 14,
  content: 13,
  identity: 10,
  conversion: 17,
  relationship: 8,
  opportunities: 8,
} as const satisfies WeightsSnapshot;

export const CREATOR_WEIGHTS = {
  positioning: 14,
  first_impression: 12,
  authority: 13,
  content: 16,
  identity: 16,
  conversion: 10,
  relationship: 11,
  opportunities: 8,
} as const satisfies WeightsSnapshot;
