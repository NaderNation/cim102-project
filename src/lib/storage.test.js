import { describe, it, expect } from "vitest";
import {
  stripPhotoForStorage,
  isRestorablePhoto,
  stripWorldForStorage,
  parseStored,
  loadProperties,
  loadWorlds,
} from "./storage.js";

describe("stripPhotoForStorage", () => {
  it("removes the non-serializable img element", () => {
    const photo = { id: "a", dataUrl: "data:image/png;base64,x", score: 7, img: { fake: "element" } };
    const stored = stripPhotoForStorage(photo);
    expect(stored).not.toHaveProperty("img");
  });

  it("keeps everything else, including the data URL that rebuilds the image", () => {
    const photo = { id: "a", dataUrl: "data:image/png;base64,x", score: 7, roomType: "Kitchen", img: {} };
    const stored = stripPhotoForStorage(photo);
    expect(stored).toEqual({ id: "a", dataUrl: "data:image/png;base64,x", score: 7, roomType: "Kitchen" });
  });

  it("produces something JSON can round-trip", () => {
    const photo = { id: "a", dataUrl: "data:image/png;base64,x", img: {} };
    expect(() => JSON.stringify(stripPhotoForStorage(photo))).not.toThrow();
  });
});

describe("isRestorablePhoto", () => {
  it("accepts a row with an id and a data URL", () => {
    expect(isRestorablePhoto({ id: "a", dataUrl: "data:image/png;base64,x" })).toBe(true);
  });

  it("rejects a row with no data URL", () => {
    expect(isRestorablePhoto({ id: "a" })).toBe(false);
  });

  it("rejects a row whose dataUrl is not a data URL", () => {
    expect(isRestorablePhoto({ id: "a", dataUrl: "https://example.com/x.png" })).toBe(false);
  });

  it("rejects a row with no id", () => {
    expect(isRestorablePhoto({ dataUrl: "data:image/png;base64,x" })).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isRestorablePhoto(null)).toBe(false);
    expect(isRestorablePhoto(undefined)).toBe(false);
  });
});

describe("stripWorldForStorage", () => {
  it("keeps the durable world_id", () => {
    const stored = stripWorldForStorage({ world_id: "w1", display_name: "Kitchen" });
    expect(stored.world_id).toBe("w1");
  });

  it("discards signed asset URLs, which expire", () => {
    const stored = stripWorldForStorage({
      world_id: "w1",
      assets: { splats: { spz_urls: { "100k": "https://signed.example/abc?sig=xyz" } } },
    });
    expect(stored).not.toHaveProperty("assets");
    expect(JSON.stringify(stored)).not.toContain("signed.example");
  });

  it("stamps savedAt when absent", () => {
    const stored = stripWorldForStorage({ world_id: "w1" });
    expect(typeof stored.savedAt).toBe("number");
  });

  it("returns null for a world with no id, which cannot be re-fetched", () => {
    expect(stripWorldForStorage({ display_name: "orphan" })).toBe(null);
    expect(stripWorldForStorage(null)).toBe(null);
  });
});

describe("parseStored", () => {
  it("parses valid JSON", () => {
    expect(parseStored('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns the fallback for corrupt JSON instead of throwing", () => {
    expect(parseStored("{not json", [])).toEqual([]);
  });

  it("returns the fallback for null (absent key)", () => {
    expect(parseStored(null, [])).toEqual([]);
  });

  it("returns the fallback when the stored value is literally null", () => {
    expect(parseStored("null", [])).toEqual([]);
  });
});

describe("loaders without a browser", () => {
  // vitest runs these in node, where localStorage does not exist. The loaders
  // must degrade to empty rather than throwing — the same path a private
  // window or blocked site data takes.
  it("loadProperties returns an empty array", () => {
    expect(loadProperties()).toEqual([]);
  });

  it("loadWorlds returns an empty object", () => {
    expect(loadWorlds()).toEqual({});
  });
});
