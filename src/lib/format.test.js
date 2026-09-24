import { describe, it, expect } from "vitest";
import { formatPrice, validHexColor, formatRoomDimensions } from "./format.js";

describe("validHexColor", () => {
  it("accepts a six-digit hex colour", () => {
    expect(validHexColor("#AABBCC")).toBe("#AABBCC");
  });

  it("returns the fallback for a malformed value", () => {
    expect(validHexColor("not-a-colour", "#123456")).toBe("#123456");
  });

  it("returns the fallback for an empty value", () => {
    expect(validHexColor("", "#123456")).toBe("#123456");
  });

  it("rejects three-digit shorthand", () => {
    expect(validHexColor("#ABC", "#123456")).toBe("#123456");
  });
});

describe("formatPrice", () => {
  it("adds a currency symbol and thousands separators", () => {
    expect(formatPrice("450000")).toBe("$450,000");
  });

  it("strips existing formatting before reformatting", () => {
    expect(formatPrice("$1,200,000")).toBe("$1,200,000");
  });

  it("returns an em-dash placeholder for an empty price", () => {
    expect(formatPrice("")).toBe("$—");
  });

  it("passes through a non-numeric string unchanged", () => {
    expect(formatPrice("Call for price")).toBe("Call for price");
  });
});

describe("formatRoomDimensions", () => {
  it("renders dimensions and computed area", () => {
    expect(formatRoomDimensions({ length: 12, width: 10 })).toBe("12 × 10 ft · 120 sq ft");
  });

  it("returns an empty string when unmeasured", () => {
    expect(formatRoomDimensions({})).toBe("");
  });

  it("appends a free-text dimensions note when present", () => {
    expect(formatRoomDimensions({ length: 12, width: 10, dimensions: "vaulted" }))
      .toBe("12 × 10 ft · 120 sq ft · vaulted");
  });
});
