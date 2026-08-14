import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "analysis-assets";
const FETCH_TIMEOUT_MS = 5000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
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
 * Extracts the @username from an Instagram profile URL. Returns null for
 * anything that isn't recognizably a profile URL (wrong host, reel/post/
 * story links, etc.) rather than guessing.
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

async function fetchOgImageUrl(username: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://www.instagram.com/${encodeURIComponent(username)}/`,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);

    return match ? match[1]!.replace(/&amp;/g, "&") : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadImage(
  imageUrl: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });

    if (!response.ok) {
      return null;
    }

    const mimeType = response.headers.get("content-type") ?? "image/jpeg";

    if (!mimeType.startsWith("image/")) {
      return null;
    }

    const bytes = await response.arrayBuffer();

    if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) {
      return null;
    }

    return { bytes, mimeType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Best-effort only -- never throws. Fetches the public Instagram profile
 * photo via the page's og:image tag and re-hosts it in our own Storage (the
 * URL Instagram serves is signed and expires, so linking it directly would
 * eventually break on an old report). Any failure along the way (network,
 * timeout, private account, Instagram blocking the request, no og:image)
 * just leaves the request without a photo -- the UI already renders that as
 * "no photo", never as an error.
 *
 * Deliberately not inserted into analysis_assets: this is a trust decoration
 * ("yes, this is really your profile"), never evidence content handed to the
 * AI for the 8-dimension analysis.
 */
export async function fetchAndStoreProfilePhotoBestEffort(params: {
  requestId: string;
  userId: string;
  instagramUrl: string;
}): Promise<void> {
  try {
    const username = extractInstagramUsername(params.instagramUrl);

    if (!username) {
      return;
    }

    const ogImageUrl = await fetchOgImageUrl(username);

    if (!ogImageUrl) {
      return;
    }

    const image = await downloadImage(ogImageUrl);

    if (!image) {
      return;
    }

    const extension = image.mimeType === "image/png" ? "png" : "jpg";
    const storagePath = `${params.userId}/${params.requestId}/profile-photo/${crypto.randomUUID()}.${extension}`;
    const admin = createSupabaseAdminClient();

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, image.bytes, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[profile-photo] upload failed:", uploadError);
      return;
    }

    const { error: updateError } = await admin
      .from("analysis_requests")
      .update({
        profile_photo_storage_path: storagePath,
        profile_photo_mime_type: image.mimeType,
      })
      .eq("id", params.requestId);

    if (updateError) {
      console.error(
        "[profile-photo] failed to record storage path:",
        updateError,
      );
    }
  } catch (error) {
    console.error("[profile-photo] unexpected failure:", error);
  }
}
