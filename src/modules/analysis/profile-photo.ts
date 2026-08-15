import "server-only";

const RESERVED_PATH_SEGMENTS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "accounts",
  "direct",
  "tv",
]);

/**
 * Extracts the @username from an Instagram profile URL, purely for display
 * (the "@username" line under the diagnosis header, and the link to the
 * real profile). Returns null for anything that isn't recognizably a
 * profile URL (wrong host, reel/post/story links, etc.) rather than
 * guessing.
 */
export function extractInstagramUsername(url: string): string | null {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) {
    return null;
  }

  const username = parsed.pathname.split("/").filter(Boolean)[0];

  if (!username || RESERVED_PATH_SEGMENTS.has(username.toLowerCase())) {
    return null;
  }

  return username;
}
