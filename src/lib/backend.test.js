import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectBackend, marbleBase, hasBackend, canLabelRooms, resetBackendDetection, BACKEND_URLS } from "./backend.js";

const jsonResponse = (body) => ({
  ok: true,
  headers: { get: (h) => (h.toLowerCase() === "content-type" ? "application/json" : null) },
  json: async () => body,
});

// What a static host (GitHub Pages) actually returns for /api/marble-health:
// its 404 page, as HTML.
const htmlNotFound = () => ({
  ok: false,
  headers: { get: () => "text/html" },
  json: async () => { throw new Error("not json"); },
});

// A host that serves index.html for unknown paths — 200, but HTML, not JSON.
const htmlFallback = () => ({
  ok: true,
  headers: { get: () => "text/html; charset=utf-8" },
  json: async () => { throw new Error("not json"); },
});

beforeEach(() => {
  resetBackendDetection();
  vi.restoreAllMocks();
});

describe("detectBackend", () => {
  it("reports proxy mode when a backend answers with ok JSON", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: true, serverKey: true, claudeKey: true }));
    const info = await detectBackend();
    expect(info.mode).toBe("proxy");
    expect(info.serverKey).toBe(true);
    expect(info.claudeKey).toBe(true);
  });

  it("reports direct mode on a 404 (static host)", async () => {
    globalThis.fetch = vi.fn(async () => htmlNotFound());
    expect((await detectBackend()).mode).toBe("direct");
  });

  it("does not mistake an HTML SPA fallback for a backend", async () => {
    // A 200 that is not JSON must not count — this is the trap on hosts that
    // serve index.html for every unknown path.
    globalThis.fetch = vi.fn(async () => htmlFallback());
    expect((await detectBackend()).mode).toBe("direct");
  });

  it("reports direct mode when the network call throws", async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    expect((await detectBackend()).mode).toBe("direct");
  });

  it("never rejects — no backend is a supported state, not an error", async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error("boom"); });
    await expect(detectBackend()).resolves.toBeTruthy();
  });

  it("treats ok:false JSON as no backend", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: false }));
    expect((await detectBackend()).mode).toBe("direct");
  });

  it("probes only once and caches the result", async () => {
    const spy = vi.fn(async () => jsonResponse({ ok: true, serverKey: false, claudeKey: false }));
    globalThis.fetch = spy;
    await detectBackend();
    await detectBackend();
    await detectBackend();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("marbleBase", () => {
  it("uses the local proxy when a backend exists", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: true }));
    expect(await marbleBase()).toBe(BACKEND_URLS.PROXY_BASE);
  });

  it("calls api.worldlabs.ai directly when there is no backend", async () => {
    globalThis.fetch = vi.fn(async () => htmlNotFound());
    expect(await marbleBase()).toBe(BACKEND_URLS.WORLDLABS_DIRECT);
    expect(await marbleBase()).toMatch(/^https:\/\/api\.worldlabs\.ai/);
  });
});

describe("hasBackend", () => {
  it("is true only in proxy mode", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: true }));
    expect(await hasBackend()).toBe(true);
    resetBackendDetection();
    globalThis.fetch = vi.fn(async () => htmlNotFound());
    expect(await hasBackend()).toBe(false);
  });
});

describe("canLabelRooms", () => {
  it("needs both a backend and a Claude key", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: true, claudeKey: true }));
    expect(await canLabelRooms()).toBe(true);
  });

  it("is false when the backend has no Claude key", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ ok: true, claudeKey: false }));
    expect(await canLabelRooms()).toBe(false);
  });

  it("is false on a static host", async () => {
    globalThis.fetch = vi.fn(async () => htmlNotFound());
    expect(await canLabelRooms()).toBe(false);
  });
});
