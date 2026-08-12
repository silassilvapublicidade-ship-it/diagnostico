const DEFAULT_SAFE_PATH = "/app";

/**
 * Returns `value` only if it is a same-origin relative path; otherwise
 * returns `fallback`. Rejects absolute URLs (any scheme), protocol-relative
 * URLs ("//host"), and backslash variants ("/\host", "\\host") that
 * browsers normalize into "//host" -- a well-known bypass for filters that
 * only check the literal "//" prefix.
 */
export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_SAFE_PATH,
): string {
  if (!value) {
    return fallback;
  }

  const normalized = value.replace(/\\/g, "/");

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
}
