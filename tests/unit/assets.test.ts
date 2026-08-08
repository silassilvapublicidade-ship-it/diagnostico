import { describe, expect, it } from "vitest";

import {
  MAX_ASSET_SIZE_BYTES,
  validateUploadCandidates,
} from "../../src/modules/assets/validation";

describe("asset upload validation", () => {
  it("accepts allowed private evidence files", () => {
    const files = validateUploadCandidates([
      {
        assetType: "profile_top",
        name: "topo.png",
        type: "image/png",
        size: 1024,
      },
      {
        assetType: "feed",
        name: "feed.pdf",
        type: "application/pdf",
        size: 2048,
      },
    ]);

    expect(files).toHaveLength(2);
  });

  it("rejects unsafe MIME types", () => {
    expect(() =>
      validateUploadCandidates([
        {
          assetType: "profile_top",
          name: "script.svg",
          type: "image/svg+xml",
          size: 1024,
        },
      ]),
    ).toThrow(/Tipo de arquivo/);
  });

  it("rejects files over the size limit", () => {
    expect(() =>
      validateUploadCandidates([
        {
          assetType: "profile_top",
          name: "grande.png",
          type: "image/png",
          size: MAX_ASSET_SIZE_BYTES + 1,
        },
      ]),
    ).toThrow(/10 MB/);
  });
});
