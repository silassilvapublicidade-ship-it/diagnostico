import type { FakeStore } from "./supabase-fake";

function toFormData(
  fields: Record<string, string | string[]>,
  assetFieldName: string,
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
    } else {
      formData.set(key, value);
    }
  }

  formData.set(
    assetFieldName,
    new File([new Uint8Array([1, 2, 3])], "topo.png", { type: "image/png" }),
  );

  return formData;
}

export function buildBusinessFormData(
  overrides: Record<string, string | string[]> = {},
) {
  return toFormData(
    {
      profileType: "business",
      instagramUrl: "https://instagram.com/acme",
      niche: "nutricao esportiva",
      mainObjective: ["Atrair mais clientes"],
      mainDifficulty: ["Meu perfil nao deixa claro o que faco"],
      processingConsent: "on",
      ...overrides,
    },
    "asset_profile_top",
  );
}

export function buildCreatorFormData(
  overrides: Record<string, string | string[]> = {},
) {
  return toFormData(
    {
      profileType: "creator",
      instagramUrl: "https://instagram.com/criador",
      niche: "gastronomia local",
      mainObjective: ["Conseguir parcerias e oportunidades"],
      mainDifficulty: ["Tenho dificuldade de me diferenciar"],
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
