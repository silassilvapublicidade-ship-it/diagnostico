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

  it("asks for exactly one recommendation per dimension and a concise, bounded read", () => {
    const prompt = buildSystemPrompt("business");

    expect(prompt).toMatch(/EXATAMENTE 1 recomendacao/);
    expect(prompt).toMatch(/norte inicial, nao uma consultoria exaustiva/);
    expect(prompt).toMatch(/2 a 4 frases/);
  });

  it("explicitly requires Brazilian Portuguese for every free-text field, reinforced at the end", () => {
    const prompt = buildSystemPrompt("creator");

    expect(prompt).toMatch(/portugues do Brasil/);
    expect(prompt).toMatch(/Nunca responda em ingles/);
    expect(prompt).toMatch(/nunca em ingles\.$/);
  });

  it("demands a concrete, copy-pasteable solution in how_to_execute instead of vague advice", () => {
    const prompt = buildSystemPrompt("business");

    expect(prompt).toMatch(/Regra critica para how_to_execute/);
    expect(prompt).toMatch(/EXEMPLO REAL e pronto de uso/);
    expect(prompt).toMatch(/sem precisar imaginar o que fazer/);
  });
});
