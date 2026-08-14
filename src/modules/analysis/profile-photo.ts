import "server-only";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import sharp from "sharp";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAnthropicClient, getAnthropicModel } from "@/modules/ai/client";

const STORAGE_BUCKET = "analysis-assets";
const OUTPUT_SIZE_PX = 240;
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
 * (the "@username" line under the diagnosis header) -- unrelated to the
 * photo itself, which comes from cropping the uploaded screenshot below.
 * Returns null for anything that isn't recognizably a profile URL (wrong
 * host, reel/post/story links, etc.) rather than guessing.
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

const avatarBoundingBoxSchema = z.object({
  avatar_found: z.boolean(),
  // Fractions of the image's width/height (0-1), not pixels -- avoids ever
  // needing to tell the model the image's actual pixel dimensions.
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

type AvatarBox = { x: number; y: number; width: number; height: number };

const MIN_BOX_FRACTION = 0.03;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Sanity-checks the box the model returned before it's ever used to crop a
 * real image -- the same "never trust AI output for something structural
 * without verifying it geometrically" discipline used for the main
 * diagnosis engine. Clamps into [0,1] and rejects anything degenerate
 * (near-zero size, fully outside the image) rather than silently cropping
 * garbage.
 */
function sanitizeBox(box: AvatarBox): AvatarBox | null {
  const x = clamp(box.x, 0, 1);
  const y = clamp(box.y, 0, 1);
  const width = clamp(box.width, 0, 1 - x);
  const height = clamp(box.height, 0, 1 - y);

  if (width < MIN_BOX_FRACTION || height < MIN_BOX_FRACTION) {
    return null;
  }

  return { x, y, width, height };
}

async function detectAvatarBoundingBox(params: {
  base64: string;
  mimeType: string;
}): Promise<{ ok: true; box: AvatarBox } | { ok: false; reason: string }> {
  const client = createAnthropicClient();
  const model = getAnthropicModel();
  const rawFormat = zodOutputFormat(avatarBoundingBoxSchema);

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    system:
      'Você recebe uma captura de tela do perfil do Instagram (feita no app ou no navegador). Localize APENAS a foto de perfil PRINCIPAL do usuário -- a única foto circular que fica sozinha bem no topo da tela, ao lado ou acima do nome de usuário e da contagem de seguidores/seguindo/publicações.\n\nATENÇÃO, erro comum a evitar: NÃO confunda a foto de perfil com os "Destaques" (Stories em destaque) -- que também são círculos com foto, mas aparecem em FILEIRA HORIZONTAL de vários círculos MENORES, sempre ABAIXO da bio, mais para o meio da tela. Se você identificar uma fileira de vários círculos parecidos, nenhum deles é a foto de perfil -- ignore todos e continue procurando o único círculo isolado no topo. A foto de perfil verdadeira é sempre única (não faz parte de um grupo/fileira) e é a primeira coisa circular com foto que aparece na tela, de cima para baixo.\n\nResponda com um retângulo delimitador (bounding box) ao redor apenas dessa foto de perfil principal, como frações da largura/altura da imagem (0 a 1) -- nunca em pixels. Se não conseguir identificar com clareza a foto de perfil principal (por exemplo, se a captura começar já no meio da tela, sem mostrar o topo), defina avatar_found como false em vez de adivinhar.',
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: params.mimeType as
                "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: params.base64,
            },
          },
          {
            type: "text",
            text: "Onde está a foto de perfil PRINCIPAL (não um Destaque) nesta captura de tela?",
          },
        ],
      },
    ],
    output_config: {
      format: { type: rawFormat.type, schema: rawFormat.schema },
    },
  });

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    return { ok: false, reason: "no text block in the model's response" };
  }

  let rawJson: unknown;

  try {
    rawJson = JSON.parse(textBlock.text);
  } catch {
    return { ok: false, reason: "response was not valid JSON" };
  }

  const parsed = avatarBoundingBoxSchema.safeParse(rawJson);

  if (!parsed.success) {
    return { ok: false, reason: `response failed schema validation` };
  }

  if (!parsed.data.avatar_found) {
    return { ok: false, reason: "model reported no avatar found" };
  }

  const box = sanitizeBox(parsed.data);

  if (!box) {
    return { ok: false, reason: "bounding box was degenerate after clamping" };
  }

  return { ok: true, box };
}

async function cropAvatar(
  imageBytes: Buffer,
  box: AvatarBox,
): Promise<Buffer | null> {
  const metadata = await sharp(imageBytes).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  if (!imgWidth || !imgHeight) {
    return null;
  }

  const left = Math.round(box.x * imgWidth);
  const top = Math.round(box.y * imgHeight);
  const width = Math.min(
    Math.max(1, Math.round(box.width * imgWidth)),
    imgWidth - left,
  );
  const height = Math.min(
    Math.max(1, Math.round(box.height * imgHeight)),
    imgHeight - top,
  );

  return sharp(imageBytes)
    .extract({ left, top, width, height })
    .resize(OUTPUT_SIZE_PX, OUTPUT_SIZE_PX, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Best-effort only -- never throws. Crops the circular avatar out of the
 * "topo do perfil" screenshot the customer already uploaded as evidence,
 * using a small, cheap Claude call to locate it (no fixed pixel offsets:
 * screenshots vary too much by device/app/browser for that to be reliable).
 * Any failure (no profile_top asset, download error, model couldn't find
 * the avatar, degenerate box, crop/resize failure, upload error) just
 * leaves the request without a photo -- the UI already renders that as "no
 * photo", never as an error. Every stop point is logged (never the image
 * bytes) so a real failure is diagnosable from Vercel logs.
 *
 * Deliberately writes to the same profile_photo_storage_path/mime_type
 * columns (and the same serving route) as the earlier live-Instagram-fetch
 * approach did -- replaced here because that approach turned out to be
 * unreliable from Vercel's own infrastructure (see git history). This
 * approach has no external network dependency at all: the source image is
 * evidence the customer already uploaded to our own Storage.
 */
export async function extractProfilePhotoBestEffort(params: {
  requestId: string;
  userId: string;
  profileTopAsset:
    | { storageBucket: string; storagePath: string; mimeType: string }
    | undefined;
}): Promise<void> {
  const log = (message: string) =>
    console.log(`[profile-photo] request=${params.requestId} ${message}`);

  try {
    if (!params.profileTopAsset) {
      log("skipped: no profile_top evidence was uploaded");
      return;
    }

    const admin = createSupabaseAdminClient();
    const { data: blob, error: downloadError } = await admin.storage
      .from(params.profileTopAsset.storageBucket)
      .download(params.profileTopAsset.storagePath);

    if (downloadError || !blob) {
      log(`stopped: could not download the profile_top evidence file`);
      return;
    }

    const sourceBuffer = Buffer.from(await blob.arrayBuffer());
    const detection = await detectAvatarBoundingBox({
      base64: sourceBuffer.toString("base64"),
      mimeType: params.profileTopAsset.mimeType,
    });

    if (!detection.ok) {
      log(`stopped at avatar detection: ${detection.reason}`);
      return;
    }

    const croppedBuffer = await cropAvatar(sourceBuffer, detection.box);

    if (!croppedBuffer) {
      log("stopped: crop/resize failed");
      return;
    }

    const storagePath = `${params.userId}/${params.requestId}/profile-photo/${crypto.randomUUID()}.jpg`;

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, croppedBuffer, {
        contentType: "image/jpeg",
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
        profile_photo_mime_type: "image/jpeg",
      })
      .eq("id", params.requestId);

    if (updateError) {
      console.error(
        "[profile-photo] failed to record storage path:",
        updateError,
      );
      return;
    }

    log("succeeded");
  } catch (error) {
    console.error("[profile-photo] unexpected failure:", error);
  }
}
