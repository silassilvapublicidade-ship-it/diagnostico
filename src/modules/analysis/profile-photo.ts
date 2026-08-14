import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "analysis-assets";
const FETCH_TIMEOUT_MS = 8000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
// Instagram only server-renders og:* meta tags for recognized link-preview
// crawler user agents (the same thing that happens when you paste an IG
// link into WhatsApp/Slack/Facebook) -- a normal browser UA gets the JS-only
// shell with no og:image tag at all. Verified directly: identical request,
// browser UA has zero "og:" tags in the response; this UA has og:image with
// a working photo URL.
const USER_AGENT = "facebookexternalhit/1.1";
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

type FetchOgImageResult =
  | { ok: true; imageUrl: string }
  | { ok: false; reason: string };

async function fetchOgImageUrl(username: string): Promise<FetchOgImageResult> {
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
      return { ok: false, reason: `page fetch returned HTTP ${response.status}` };
    }

    const html = await response.text();
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);

    if (!match) {
      return {
        ok: false,
        reason: `no og:image tag in response (${html.length} bytes)`,
      };
    }

    return { ok: true, imageUrl: match[1]!.replace(/&amp;/g, "&") };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? `page fetch timed out after ${FETCH_TIMEOUT_MS}ms`
        : `page fetch threw: ${String(error)}`;
    return { ok: false, reason };
  } finally {
    clearTimeout(timeout);
  }
}

type DownloadImageResult =
  | { ok: true; bytes: ArrayBuffer; mimeType: string }
  | { ok: false; reason: string };

async function downloadImage(imageUrl: string): Promise<DownloadImageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });

    if (!response.ok) {
      return { ok: false, reason: `image fetch returned HTTP ${response.status}` };
    }

    const mimeType = response.headers.get("content-type") ?? "image/jpeg";

    if (!mimeType.startsWith("image/")) {
      return { ok: false, reason: `unexpected content-type: ${mimeType}` };
    }

    const bytes = await response.arrayBuffer();

    if (bytes.byteLength === 0) {
      return { ok: false, reason: "downloaded 0 bytes" };
    }

    if (bytes.byteLength > MAX_PHOTO_BYTES) {
      return { ok: false, reason: `image too large (${bytes.byteLength} bytes)` };
    }

    return { ok: true, bytes, mimeType };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? `image fetch timed out after ${FETCH_TIMEOUT_MS}ms`
        : `image fetch threw: ${String(error)}`;
    return { ok: false, reason };
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
 * "no photo", never as an error. Every stop point is logged (never the
 * bytes/content, just the reason) so a real failure is diagnosable from
 * Vercel logs instead of being a silent, unexplained no-op.
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
  const log = (message: string) =>
    console.log(`[profile-photo] request=${params.requestId} ${message}`);

  try {
    const username = extractInstagramUsername(params.instagramUrl);

    if (!username) {
      log(`skipped: "${params.instagramUrl}" is not a recognizable Instagram profile URL`);
      return;
    }

    const pageResult = await fetchOgImageUrl(username);

    if (!pageResult.ok) {
      log(`stopped at page fetch for @${username}: ${pageResult.reason}`);
      return;
    }

    const imageResult = await downloadImage(pageResult.imageUrl);

    if (!imageResult.ok) {
      log(`stopped at image download for @${username}: ${imageResult.reason}`);
      return;
    }

    const extension = imageResult.mimeType === "image/png" ? "png" : "jpg";
    const storagePath = `${params.userId}/${params.requestId}/profile-photo/${crypto.randomUUID()}.${extension}`;
    const admin = createSupabaseAdminClient();

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageResult.bytes, {
        contentType: imageResult.mimeType,
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
        profile_photo_mime_type: imageResult.mimeType,
      })
      .eq("id", params.requestId);

    if (updateError) {
      console.error(
        "[profile-photo] failed to record storage path:",
        updateError,
      );
      return;
    }

    log(`succeeded for @${username}`);
  } catch (error) {
    console.error("[profile-photo] unexpected failure:", error);
  }
}
