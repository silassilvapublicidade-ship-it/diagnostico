import "server-only";

import {
  calculateAnalysisResult,
  type AnalysisCalculationResult,
  type ProfileType,
} from "@/domain/methodology-8d";
import { businessCompleteFixture } from "../../../tests/fixtures/business_complete";
import { creatorCompleteFixture } from "../../../tests/fixtures/creator_complete";
import { creatorLowEvidenceFixture } from "../../../tests/fixtures/creator_low_evidence";

import type { ResultOrigin } from "./result-origin";

export type DevelopmentFixtureKind =
  "business_complete" | "creator_complete" | "creator_low_evidence";

export type DevelopmentFixtureResult = {
  origin: Extract<ResultOrigin, "development_fixture">;
  fixtureKind: DevelopmentFixtureKind;
  result: AnalysisCalculationResult;
};

export function assertDevelopmentFixturesEnabled(env: {
  NODE_ENV?: string;
  ENABLE_DEVELOPMENT_FIXTURES?: string;
}): void {
  if (env.NODE_ENV !== "development") {
    throw new Error("Development fixtures are only available in development.");
  }

  if (env.ENABLE_DEVELOPMENT_FIXTURES !== "true") {
    throw new Error("Development fixtures require an explicit env flag.");
  }
}

export function buildDevelopmentFixtureResult(
  profileType: ProfileType,
): DevelopmentFixtureResult {
  assertDevelopmentFixturesEnabled(process.env);

  const fixture =
    profileType === "business"
      ? businessCompleteFixture
      : creatorCompleteFixture;

  return {
    origin: "development_fixture",
    fixtureKind:
      profileType === "business" ? "business_complete" : "creator_complete",
    result: calculateAnalysisResult(fixture),
  };
}

export function buildLowEvidenceDevelopmentFixtureForTests(): DevelopmentFixtureResult {
  assertDevelopmentFixturesEnabled(process.env);

  return {
    origin: "development_fixture",
    fixtureKind: "creator_low_evidence",
    result: calculateAnalysisResult(creatorLowEvidenceFixture),
  };
}
