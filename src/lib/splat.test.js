import { describe, it, expect } from "vitest";
import {
  pickSplatUrl, hasSplat, splatPlacement, splatFetchUrl, formatBytes, EYE_HEIGHT_M,
} from "./splat.js";

const world = (spz, semantics) => ({
  assets: { splats: { spz_urls: spz, semantics_metadata: semantics } },
});

describe("pickSplatUrl", () => {
  const full = world({ "100k": "u100", "500k": "u500", full_res: "ufull" });

  it("returns the requested quality", () => {
    expect(pickSplatUrl(full, "500k")).toBe("u500");
    expect(pickSplatUrl(full, "full_res")).toBe("ufull");
  });

  it("defaults to the fast 100k tier", () => {
    expect(pickSplatUrl(full)).toBe("u100");
  });

  it("falls back when the requested tier is missing", () => {
    expect(pickSplatUrl(world({ full_res: "ufull" }), "100k")).toBe("ufull");
  });

  it("returns null when the world has no splats", () => {
    expect(pickSplatUrl(world({}))).toBe(null);
    expect(pickSplatUrl({})).toBe(null);
    expect(pickSplatUrl(null)).toBe(null);
  });

  it("ignores empty-string URLs", () => {
    expect(pickSplatUrl(world({ "100k": "", "500k": "u500" }))).toBe("u500");
  });
});

describe("hasSplat", () => {
  it("is true only when some splat URL exists", () => {
    expect(hasSplat(world({ "100k": "u" }))).toBe(true);
    expect(hasSplat(world({}))).toBe(false);
    expect(hasSplat(null)).toBe(false);
  });
});

describe("splatPlacement", () => {
  it("reads metric scale and ground offset", () => {
    const p = splatPlacement(world({}, { metric_scale_factor: 2, ground_plane_offset: 0.5 }));
    expect(p.scale).toBe(2);
    expect(p.ground).toBe(0.5);
  });

  it("puts the camera at standing height above the floor", () => {
    const p = splatPlacement(world({}, { ground_plane_offset: 0.5 }));
    expect(p.eyeHeight).toBeCloseTo(0.5 + EYE_HEIGHT_M);
  });

  it("falls back to identity when metadata is absent, never NaN", () => {
    const p = splatPlacement({});
    expect(p.scale).toBe(1);
    expect(p.ground).toBe(0);
    expect(Number.isNaN(p.eyeHeight)).toBe(false);
  });

  it("rejects a zero or negative scale, which would collapse the scene", () => {
    expect(splatPlacement(world({}, { metric_scale_factor: 0 })).scale).toBe(1);
    expect(splatPlacement(world({}, { metric_scale_factor: -3 })).scale).toBe(1);
  });

  it("ignores non-numeric metadata", () => {
    const p = splatPlacement(world({}, { metric_scale_factor: "big", ground_plane_offset: null }));
    expect(p.scale).toBe(1);
    expect(p.ground).toBe(0);
  });
});

describe("splatFetchUrl", () => {
  const signed = "https://signed.example/a.spz?sig=1";

  it("routes through the backend when one exists", () => {
    expect(splatFetchUrl(signed, { backend: true }))
      .toBe("/api/marble-splat?url=" + encodeURIComponent(signed));
  });

  it("fetches the signed URL directly when there is no backend", () => {
    expect(splatFetchUrl(signed, { backend: false })).toBe(signed);
  });

  it("encodes the query string so the signature survives proxying", () => {
    expect(splatFetchUrl("https://x/a.spz?sig=a&b=c", { backend: true })).toContain("%3Fsig%3Da%26b%3Dc");
  });

  it("uses a bundled local path as-is in either mode", () => {
    expect(splatFetchUrl("/sample/ceramic.spz", { backend: true })).toBe("/sample/ceramic.spz");
    expect(splatFetchUrl("/sample/ceramic.spz", { backend: false })).toBe("/sample/ceramic.spz");
  });

  it("handles a GitHub Pages subpath sample without proxying it", () => {
    expect(splatFetchUrl("/my-repo/sample/ceramic.spz", { backend: false })).toBe("/my-repo/sample/ceramic.spz");
  });

  it("returns null for no URL", () => {
    expect(splatFetchUrl(null, { backend: true })).toBe(null);
    expect(splatFetchUrl(null, { backend: false })).toBe(null);
  });

  it("defaults to backend mode when unspecified", () => {
    expect(splatFetchUrl(signed)).toContain("/api/marble-splat");
  });
});

describe("formatBytes", () => {
  it("uses KB below a megabyte", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("uses MB above a megabyte", () => {
    expect(formatBytes(30 * 1024 * 1024)).toBe("30.0 MB");
  });

  it("returns empty for unknown sizes", () => {
    expect(formatBytes(0)).toBe("");
    expect(formatBytes(NaN)).toBe("");
  });
});
