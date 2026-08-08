import type { FakeStore } from "./supabase-fake";

function toFormData(fields: Record<string, string>, assetFieldName: string) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  formData.set(
    assetFieldName,
    new File([new Uint8Array([1, 2, 3])], "topo.png", { type: "image/png" }),
  );

  return formData;
}

export function buildBusinessFormData(overrides: Record<string, string> = {}) {
  return toFormData(
    {
      profileType: "business",
      instagramUrl: "https://instagram.com/acme",
      mainObjective: "atrair mais pacientes com clareza",
      mainDifficulty: "o perfil comunica pouco valor hoje",
      desiredCta: "agendar conversa",
      segment: "nutricao",
      mainOffer: "consulta online",
      targetAudience: "mulheres com rotina intensa",
      differentiators: "metodo acolhedor e pratico",
      authorityProofs: "depoimentos e bastidores do processo",
      currentContext: "conteudo educativo sem conversao clara",
      processingConsent: "on",
      ...overrides,
    },
    "asset_profile_top",
  );
}

export function buildCreatorFormData(overrides: Record<string, string> = {}) {
  return toFormData(
    {
      profileType: "creator",
      instagramUrl: "https://instagram.com/criador",
      mainObjective: "crescer e conseguir parcerias",
      mainDifficulty: "bio e proposta comercial pouco claras",
      desiredCta: "pedir midia kit",
      niche: "gastronomia local",
      contentTerritory: "restaurantes acessiveis",
      desiredAudience: "moradores de Belo Horizonte",
      formats: "reels, listas e stories",
      desiredPartnerships: "restaurantes e marcas locais",
      perceivedIdentity: "voz direta e bem humorada",
      processingConsent: "on",
      ...overrides,
    },
    "asset_profile_top",
  );
}

export async function captureRedirectDigest(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return (error as Error & { digest?: string }).digest ?? "";
    }
    throw error;
  }

  throw new Error("Expected the server action to redirect.");
}

export function resetFakeStore(store: FakeStore) {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}
