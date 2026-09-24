import { describe, it, expect, beforeEach } from "vitest";
import { loadApiKey, saveApiKey, clearApiKey, hasApiKey, maskApiKey } from "./settings.js";

// vitest runs in node; provide a minimal localStorage so the round-trip is real.
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

describe("saveApiKey / loadApiKey", () => {
  it("round-trips a key across a simulated reload", () => {
    saveApiKey("abc123");
    expect(loadApiKey()).toBe("abc123");
  });

  it("normalises a pasted header prefix before storing", () => {
    saveApiKey("WLT-Api-Key: abc123");
    expect(loadApiKey()).toBe("abc123");
  });

  it("strips quotes and whitespace from a sloppy paste", () => {
    saveApiKey('  "abc123"  ');
    expect(loadApiKey()).toBe("abc123");
  });

  it("returns the normalised key it stored", () => {
    expect(saveApiKey("WLT-Api-Key: abc123")).toBe("abc123");
  });

  it("treats saving an empty value as clearing", () => {
    saveApiKey("abc123");
    saveApiKey("");
    expect(loadApiKey()).toBe("");
    expect(hasApiKey()).toBe(false);
  });
});

describe("clearApiKey", () => {
  it("removes a stored key", () => {
    saveApiKey("abc123");
    clearApiKey();
    expect(loadApiKey()).toBe("");
  });
});

describe("hasApiKey", () => {
  it("is false before anything is saved", () => {
    expect(hasApiKey()).toBe(false);
  });

  it("is true once a key is saved", () => {
    saveApiKey("abc123");
    expect(hasApiKey()).toBe(true);
  });
});

describe("maskApiKey", () => {
  it("shows only the first and last four characters", () => {
    expect(maskApiKey("wlt_abcdefghijkl_a91f")).toBe("wlt_…a91f");
  });

  it("never reveals the middle of the key", () => {
    expect(maskApiKey("wlt_SECRETMIDDLE_a91f")).not.toContain("SECRETMIDDLE");
  });

  it("fully masks a short key rather than revealing most of it", () => {
    const masked = maskApiKey("abc123");
    expect(masked).toBe("…".repeat("abc123".length));
    expect(masked).not.toContain("abc");
  });

  it("returns an empty string for no key", () => {
    expect(maskApiKey("")).toBe("");
    expect(maskApiKey(null)).toBe("");
  });
});

describe("storage unavailable", () => {
  it("degrades to no key instead of throwing", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() { throw new Error("blocked"); },
    });
    expect(() => loadApiKey()).not.toThrow();
    expect(loadApiKey()).toBe("");
    delete globalThis.localStorage;
  });
});
