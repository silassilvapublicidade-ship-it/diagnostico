import { BUSINESS_WEIGHTS, CREATOR_WEIGHTS, DIMENSIONS } from "./constants";
import type { DimensionKey, ProfileType, WeightsSnapshot } from "./types";

export function getWeights(profileType: ProfileType): WeightsSnapshot {
  return profileType === "business" ? BUSINESS_WEIGHTS : CREATOR_WEIGHTS;
}

export function isDimensionKey(value: string): value is DimensionKey {
  return DIMENSIONS.includes(value as DimensionKey);
}

export function assertCompleteDimensionSet(dimensions: DimensionKey[]): void {
  const unique = new Set(dimensions);

  if (unique.size !== DIMENSIONS.length) {
    throw new Error(
      "Analysis must include each Methodology 8D dimension once.",
    );
  }

  for (const dimension of DIMENSIONS) {
    if (!unique.has(dimension)) {
      throw new Error(`Missing Methodology 8D dimension: ${dimension}.`);
    }
  }
}
