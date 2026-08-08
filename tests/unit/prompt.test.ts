import { describe, expect, it } from "vitest";

import { DIMENSIONS } from "@/domain/methodology-8d";
import { buildSystemPrompt } from "@/modules/ai/prompt";

describe("buildSystemPrompt", () => {
  it("explicitly requires exactly 8 dimension entries, one per dimension key", () => {
    const prompt = buildSystemPrompt("business");

    expect(prompt).toContain("exatamente 8 entradas");
    for (const dimension of DIMENSIONS) {
      expect(prompt).toContain(dimension);
    }
  });

  it("instructs insufficient_evidence instead of omitting a dimension", () => {
    const prompt = buildSystemPrompt("creator");

    expect(prompt).toMatch(/omitir a dimensao/i);
    expect(prompt).toContain("insufficient_evidence");
  });

  it("instructs the model never to use the internal-only '8D' name", () => {
    const prompt = buildSystemPrompt("business");

    expect(prompt).toMatch(/Nunca use o termo "Metodologia 8D"/);
  });

  it("clarifies the minimal briefing is complete by design and forbids incomplete_briefing for missing business metrics", () => {
    const prompt = buildSystemPrompt("creator");

    expect(prompt).toMatch(/deliberadamente enxuto/);
    expect(prompt).toMatch(
      /nunca trate a ausencia delas como motivo de revisao/,
    );
    expect(prompt).toMatch(/nunca porque voce gostaria de ter mais dados/);
  });
});
