import { describe, expect, it } from "vitest";

import {
  consentSchema,
  diagnosisBriefingSchema,
  toAnswerRows,
} from "../../src/modules/analysis/briefing";

describe("briefing schema", () => {
  it("validates a business briefing with the simplified MVP fields", () => {
    const parsed = diagnosisBriefingSchema.parse({
      profileType: "business",
      instagramUrl: "https://instagram.com/acme",
      niche: "nutricao esportiva",
      mainObjective: ["Atrair mais clientes", "Ser visto como referencia"],
      mainDifficulty: ["Meu perfil nao mostra meu valor"],
    });

    expect(parsed.profileType).toBe("business");
    expect(toAnswerRows(parsed).map((row) => row.question_key)).toEqual(
      expect.arrayContaining(["niche", "mainObjective", "mainDifficulty"]),
    );
  });

  it("validates a creator briefing with the same simplified fields", () => {
    const parsed = diagnosisBriefingSchema.parse({
      profileType: "creator",
      instagramUrl: "https://instagram.com/criador",
      niche: "gastronomia local",
      mainObjective: ["Conseguir novas oportunidades"],
      mainDifficulty: ["Quero me destacar dos concorrentes"],
    });

    expect(parsed.profileType).toBe("creator");
    expect(parsed.mainObjective).toEqual(["Conseguir novas oportunidades"]);
  });

  it("requires at least one selected objective", () => {
    expect(() =>
      diagnosisBriefingSchema.parse({
        profileType: "business",
        instagramUrl: "https://instagram.com/acme",
        niche: "nutricao esportiva",
        mainObjective: [],
        mainDifficulty: ["Nao sei que conteudo criar"],
      }),
    ).toThrow();
  });

  it("requires at least one selected difficulty", () => {
    expect(() =>
      diagnosisBriefingSchema.parse({
        profileType: "business",
        instagramUrl: "https://instagram.com/acme",
        niche: "nutricao esportiva",
        mainObjective: ["Atrair mais clientes"],
        mainDifficulty: [],
      }),
    ).toThrow();
  });

  it("requires processing consent", () => {
    expect(() =>
      consentSchema.parse({ processingConsent: "on" }),
    ).not.toThrow();
    expect(() =>
      consentSchema.parse({ processingConsent: undefined }),
    ).toThrow();
  });
});
