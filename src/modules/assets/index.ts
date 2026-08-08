export const ASSET_RETENTION_DAYS_AFTER_COMPLETION = 90;

export const PRIVATE_ANALYSIS_ASSETS_BUCKET = "analysis-assets";

export const ALLOWED_ANALYSIS_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_ANALYSIS_ASSET_SIZE_BYTES = 10 * 1024 * 1024;
