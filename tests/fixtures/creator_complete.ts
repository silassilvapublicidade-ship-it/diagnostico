import type { AnalysisCalculationInput } from "../../src/domain/methodology-8d";

export const creatorCompleteFixture = {
  profileType: "creator",
  generatedAt: "2026-08-07T12:00:00.000Z",
  dimensions: [
    {
      dimension: "positioning",
      status: "evaluated",
      score: 76,
      confidence: "high",
      evidenceAvailable: ["bio", "name field", "local food content"],
      evidenceMissing: [],
      limitations: [
        "Commercial positioning was inferred only from available profile paths.",
      ],
      safeRecommendation:
        "Evolve from cheap food to honest cost-benefit curation for Belo Horizonte.",
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      score: 63,
      confidence: "high",
      evidenceAvailable: ["profile top", "highlights", "bio"],
      evidenceMissing: [],
      limitations: ["New visitor behavior was not measured."],
      safeRecommendation:
        "Create a route for new followers and brands with Comece aqui and Parcerias highlights.",
    },
    {
      dimension: "authority",
      status: "evaluated",
      score: 58,
      confidence: "medium",
      evidenceAvailable: [
        "consistent theme",
        "local repertoire",
        "opinionated content",
      ],
      evidenceMissing: ["formal criteria", "collaboration history"],
      limitations: [
        "Authority comes from curation evidence, not formal credential evidence.",
      ],
      safeRecommendation:
        "Publish clear criteria for how places are selected and evaluated.",
    },
    {
      dimension: "content",
      status: "evaluated",
      score: 74,
      confidence: "high",
      evidenceAvailable: [
        "Reels",
        "local lists",
        "saves and shares from fictitious insights",
      ],
      evidenceMissing: [],
      limitations: ["Retention was not provided."],
      safeRecommendation:
        "Create recurring editorial series such as Vale o preco and PF honesto.",
    },
    {
      dimension: "identity",
      status: "evaluated",
      score: 81,
      confidence: "high",
      evidenceAvailable: [
        "voice",
        "humor",
        "local language",
        "visual territory",
      ],
      evidenceMissing: [],
      limitations: ["Full brand system was not assessed."],
      safeRecommendation:
        "Keep the local voice and add a minimal cover system for recognition.",
    },
    {
      dimension: "conversion",
      status: "evaluated",
      score: 47,
      confidence: "high",
      evidenceAvailable: [
        "email",
        "bio link",
        "declared partnership objective",
      ],
      evidenceMissing: ["media kit", "formats", "commercial criteria"],
      limitations: [
        "Partnership conversion cannot be asserted without real contacts.",
      ],
      safeRecommendation:
        "Create a simple partnership page with audience, formats, and editorial principles.",
    },
    {
      dimension: "relationship",
      status: "evaluated",
      score: 66,
      confidence: "medium",
      evidenceAvailable: ["saves", "shares", "declared audience messages"],
      evidenceMissing: ["comments", "DM screenshots", "story replies"],
      limitations: [
        "Community quality cannot be fully assessed without interaction samples.",
      ],
      safeRecommendation:
        "Create community rituals around bairro da semana and vale o preco prompts.",
    },
    {
      dimension: "opportunities",
      status: "evaluated",
      score: 78,
      confidence: "high",
      evidenceAvailable: [
        "local audience",
        "map clicks",
        "commercializable theme",
      ],
      evidenceMissing: [],
      limitations: ["No revenue or closed partnership history was provided."],
      safeRecommendation:
        "Professionalize the commercial surface without changing the editorial voice.",
    },
  ],
} satisfies AnalysisCalculationInput;
