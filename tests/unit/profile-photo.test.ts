import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetFakeStore } from "../mocks/persistence-harness";
import {
  seedRow,
  seedStorageFile,
  type FakeStore,
} from "../mocks/supabase-fake";
import { extractInstagramUsername } from "@/modules/analysis/profile-photo";

const harness = vi.hoisted(() => ({
  store: {} as FakeStore,
}));

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

vi.mock("@/modules/ai/client", () => ({
  createAnthropicClient: () => ({ messages: { create: mockCreate } }),
  getAnthropicModel: () => "claude-sonnet-5",
}));

const BUCKET = "analysis-assets";

function boxResponse(box: {
  avatar_found: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  return {
    content: [{ type: "text", text: JSON.stringify(box) }],
  };
}

async function makeTestScreenshot(): Promise<Uint8Array<ArrayBuffer>> {
  // A real, valid 200x200 PNG -- sharp needs actual image bytes to extract
  // from, not a fake/opaque buffer. Converted to a plain Uint8Array (not
  // Buffer) so it satisfies seedStorageFile's BlobPart type.
  const buffer = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 20, g: 20, b: 20 },
    },
  })
    .png()
    .toBuffer();

  // Buffer/sharp's output is typed as Uint8Array<ArrayBufferLike>, which
  // TypeScript won't accept as a BlobPart (that requires a concrete
  // ArrayBuffer, excluding SharedArrayBuffer) -- copy into a fresh
  // ArrayBuffer-backed view to satisfy seedStorageFile's type.
  const copy = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(copy).set(buffer);
  return new Uint8Array(copy);
}

describe("extractInstagramUsername", () => {
  it("extracts the username from a plain profile URL", () => {
    expect(
      extractInstagramUsername("https://instagram.com/silassilva.click"),
    ).toBe("silassilva.click");
  });

  it("extracts the username with www, trailing slash, and query params", () => {
    expect(
      extractInstagramUsername(
        "https://www.instagram.com/silassilva.click/?hl=pt-br",
      ),
    ).toBe("silassilva.click");
  });

  it("returns null for a non-Instagram host", () => {
    expect(
      extractInstagramUsername("https://example.com/silassilva.click"),
    ).toBeNull();
  });

  it("returns null for reel/post/story links, never mistaking them for a username", () => {
    expect(
      extractInstagramUsername("https://instagram.com/reel/abc123/"),
    ).toBeNull();
    expect(
      extractInstagramUsername("https://instagram.com/p/abc123/"),
    ).toBeNull();
    expect(
      extractInstagramUsername("https://instagram.com/stories/someone/"),
    ).toBeNull();
  });

  it("returns null for a URL with no path segment", () => {
    expect(extractInstagramUsername("https://instagram.com/")).toBeNull();
  });

  it("returns null for a malformed URL instead of throwing", () => {
    expect(extractInstagramUsername("not a url")).toBeNull();
  });
});

describe("extractProfilePhotoBestEffort", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    mockCreate.mockReset();
  });

  it("skips (no throw, no store) when no profile_top asset was uploaded", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      extractProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        profileTopAsset: undefined,
      }),
    ).resolves.toBeUndefined();

    expect(mockCreate).not.toHaveBeenCalled();
    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws and never stores when the evidence file can't be downloaded", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/missing.png",
        mimeType: "image/png",
      },
    });

    expect(mockCreate).not.toHaveBeenCalled();
    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("crops, stores, and records the path when the model finds the avatar", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockResolvedValueOnce(
      boxResponse({
        avatar_found: true,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      }),
    );

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/print.png",
        mimeType: "image/png",
      },
    });

    const updated = (harness.store.analysis_requests ?? [])[0]!;
    expect(updated.profile_photo_storage_path).toContain(
      `user-1/${request.id}/profile-photo/`,
    );
    expect(updated.profile_photo_mime_type).toBe("image/jpeg");
    expect(harness.store.__storage).toHaveLength(1);
  });

  it("never throws and never stores when the model reports no avatar found", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockResolvedValueOnce(boxResponse({ avatar_found: false }));

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/print.png",
        mimeType: "image/png",
      },
    });

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
    expect(harness.store.__storage ?? []).toHaveLength(0);
  });

  it("never throws and never stores when the model's box is degenerate (near-zero size)", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockResolvedValueOnce(
      boxResponse({ avatar_found: true, x: 0.5, y: 0.5, width: 0, height: 0 }),
    );

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/print.png",
        mimeType: "image/png",
      },
    });

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws and never stores when the model's response is not valid JSON", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "not json" }],
    });

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/print.png",
        mimeType: "image/png",
      },
    });

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws when the Anthropic call itself throws (network error, timeout)", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockRejectedValueOnce(new Error("network blip"));

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      extractProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        profileTopAsset: {
          storageBucket: BUCKET,
          storagePath: "user-1/req/profile_top/print.png",
          mimeType: "image/png",
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("never throws when the Storage upload itself fails", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    harness.store.__storageShouldFail = true;
    mockCreate.mockResolvedValueOnce(
      boxResponse({
        avatar_found: true,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      }),
    );

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      extractProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        profileTopAsset: {
          storageBucket: BUCKET,
          storagePath: "user-1/req/profile_top/print.png",
          mimeType: "image/png",
        },
      }),
    ).resolves.toBeUndefined();

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("is never inserted into analysis_assets -- it must never be treated as AI evidence", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
    });
    const screenshot = await makeTestScreenshot();
    seedStorageFile(harness.store, BUCKET, "user-1/req/profile_top/print.png", {
      data: screenshot,
      type: "image/png",
    });
    mockCreate.mockResolvedValueOnce(
      boxResponse({
        avatar_found: true,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      }),
    );

    const { extractProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await extractProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      profileTopAsset: {
        storageBucket: BUCKET,
        storagePath: "user-1/req/profile_top/print.png",
        mimeType: "image/png",
      },
    });

    expect(harness.store.analysis_assets ?? []).toHaveLength(0);
  });
});
