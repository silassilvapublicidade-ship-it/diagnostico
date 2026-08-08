import { z } from "zod";

export const ASSET_TYPES = [
  "profile_top",
  "feed",
  "highlights",
  "insights",
  "stories",
  "comments",
  "other",
] as const;

export const ALLOWED_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_ASSET_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_ASSET_TYPE = 4;
export const MAX_FILES_PER_ANALYSIS = 20;

export const assetTypeSchema = z.enum(ASSET_TYPES);
export const assetMimeTypeSchema = z.enum(ALLOWED_ASSET_MIME_TYPES);

export type AssetType = (typeof ASSET_TYPES)[number];

export type UploadCandidate = {
  assetType: AssetType;
  name: string;
  type: string;
  size: number;
};

export type ValidatedUploadCandidate = UploadCandidate & {
  type: (typeof ALLOWED_ASSET_MIME_TYPES)[number];
};

export function validateUploadCandidates(
  candidates: UploadCandidate[],
): ValidatedUploadCandidate[] {
  if (candidates.length === 0) {
    throw new Error("Envie pelo menos uma evidencia do perfil.");
  }

  if (candidates.length > MAX_FILES_PER_ANALYSIS) {
    throw new Error(
      `Envie no maximo ${MAX_FILES_PER_ANALYSIS} arquivos por diagnostico.`,
    );
  }

  const countByType = new Map<AssetType, number>();

  return candidates.map((candidate) => {
    const currentCount = countByType.get(candidate.assetType) ?? 0;
    const nextCount = currentCount + 1;
    countByType.set(candidate.assetType, nextCount);

    if (nextCount > MAX_FILES_PER_ASSET_TYPE) {
      throw new Error(
        `Envie no maximo ${MAX_FILES_PER_ASSET_TYPE} arquivos para ${candidate.assetType}.`,
      );
    }

    const mimeType = assetMimeTypeSchema.safeParse(candidate.type);

    if (!mimeType.success) {
      throw new Error(`Tipo de arquivo nao permitido: ${candidate.type}.`);
    }

    if (candidate.size <= 0 || candidate.size > MAX_ASSET_SIZE_BYTES) {
      throw new Error("Cada arquivo deve ter ate 10 MB.");
    }

    return {
      ...candidate,
      type: mimeType.data,
    };
  });
}

export function collectUploadCandidates(formData: FormData): File[] {
  return ASSET_TYPES.flatMap((assetType) =>
    formData
      .getAll(`asset_${assetType}`)
      .filter((value): value is File => value instanceof File && value.size > 0)
      .map((file) => {
        Object.defineProperty(file, "assetType", {
          value: assetType,
          enumerable: false,
        });

        return file;
      }),
  );
}

export function getFileAssetType(file: File): AssetType {
  return (file as File & { assetType?: AssetType }).assetType ?? "other";
}
