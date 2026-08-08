import { describe, expect, it } from "vitest";

import {
  businessBriefingSchema,
  consentSchema,
  creatorBriefingSchema,
  toAnswerRows,
} from "../../src/modules/analysis/briefing";

describe("briefing schemas", () => {
  it("validates business briefing fields with methodological purpose", () => {
    const parsed = businessBriefingSchema.parse({
      profileType: "business",
      instagramUrl: "https://instagram.com/acme",
      segment: "nutricao",
      mainOffer: "consulta online",
      targetAudience: "mulheres com rotina intensa",
      mainObjective: "atrair pacientes com mais clareza",
      mainDifficulty: "perfil comunica pouco valor",
      differentiators: "metodo acolhedor e pratico",
      desiredCta: "agendar conversa",
      authorityProofs: "depoimentos e bastidores do processo",
      currentContext: "conteudo educativo sem conversao clara",
      links: "https://example.com",
      reputationRestrictions: "",
      additionalNotes: "",
    });

    expect(parsed.profileType).toBe("business");
    expect(toAnswerRows(parsed).map((row) => row.question_key)).toContain(
      "authorityProofs",
    );
  });

  it("validates creator briefing fields", () => {
    const parsed = creatorBriefingSchema.parse({
      profileType: "creator",
      instagramUrl: "https://instagram.com/criador",
      niche: "gastronomia local",
      contentTerritory: "restaurantes acessiveis",
      desiredAudience: "moradores de Belo Horizonte",
      mainObjective: "crescer e conseguir parcerias",
      mainDifficulty: "bio e proposta comercial pouco claras",
      formats: "reels, listas e stories",
      desiredPartnerships: "restaurantes e marcas locais",
      perceivedIdentity: "voz direta e bem humorada",
      desiredCta: "pedir midia kit",
      links: "https://example.com/parcerias",
      exposureLimits: "nao expor familia",
      reputationRestrictions: "",
      additionalNotes: "",
    });

    expect(parsed.profileType).toBe("creator");
    expect(parsed.links).toEqual(["https://example.com/parcerias"]);
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
