// Exercises the real IndexedDB code path against an in-memory implementation,
// so savePhotos/loadStoredPhotos are verified rather than assumed.
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { savePhotos, loadStoredPhotos, clearPhotos } from "./storage.js";

const photo = (id, extra = {}) => ({
  id,
  dataUrl: "data:image/png;base64,aGVsbG8=",
  score: 5,
  img: { tagName: "IMG" }, // non-serializable stand-in
  ...extra,
});

beforeEach(async () => {
  await clearPhotos();
});

describe("photo persistence round-trip", () => {
  it("saves photos and reads them back", async () => {
    await savePhotos([photo("a"), photo("b")]);
    const rows = await loadStoredPhotos();
    expect(rows.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("drops the img element, which structured clone cannot store", async () => {
    await savePhotos([photo("a")]);
    const [row] = await loadStoredPhotos();
    expect(row).not.toHaveProperty("img");
    expect(row.dataUrl).toBe("data:image/png;base64,aGVsbG8=");
  });

  it("keeps the fields the app needs after a reload", async () => {
    await savePhotos([photo("a", { roomType: "Kitchen", length: 12, width: 10 })]);
    const [row] = await loadStoredPhotos();
    expect(row.roomType).toBe("Kitchen");
    expect(row.length).toBe(12);
    expect(row.score).toBe(5);
  });

  it("replaces the stored set rather than appending to it", async () => {
    await savePhotos([photo("a"), photo("b")]);
    await savePhotos([photo("c")]);
    const rows = await loadStoredPhotos();
    expect(rows.map((r) => r.id)).toEqual(["c"]);
  });

  it("skips rows with no usable data URL", async () => {
    await savePhotos([photo("a"), { id: "bad", score: 1 }]);
    const rows = await loadStoredPhotos();
    expect(rows.map((r) => r.id)).toEqual(["a"]);
  });

  it("returns an empty array when nothing is stored", async () => {
    expect(await loadStoredPhotos()).toEqual([]);
  });

  it("clearPhotos empties the store", async () => {
    await savePhotos([photo("a")]);
    await clearPhotos();
    expect(await loadStoredPhotos()).toEqual([]);
  });
});
