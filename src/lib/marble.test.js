import { describe, it, expect } from "vitest";
import { normalizeWorldLabsKey, WORLDLABS_BASE } from "./marble.js";

describe("WORLDLABS_BASE", () => {
  it("points at the same-origin proxy, not the vendor directly", () => {
    expect(WORLDLABS_BASE).toBe("/api/marble");
  });
});

describe("normalizeWorldLabsKey", () => {
  it("strips a pasted WLT-Api-Key header prefix", () => {
    expect(normalizeWorldLabsKey("WLT-Api-Key: abc123")).toBe("abc123");
  });

  it("strips surrounding quotes and whitespace", () => {
    expect(normalizeWorldLabsKey('  "abc123"  ')).toBe("abc123");
  });

  it("returns an empty string for null or undefined", () => {
    expect(normalizeWorldLabsKey(null)).toBe("");
    expect(normalizeWorldLabsKey(undefined)).toBe("");
  });

  it("leaves a clean key untouched", () => {
    expect(normalizeWorldLabsKey("abc123")).toBe("abc123");
  });

  it("strips internal whitespace from a wrapped paste", () => {
    expect(normalizeWorldLabsKey("abc 123")).toBe("abc123");
  });
});
