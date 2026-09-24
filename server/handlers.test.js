import { describe, it, expect } from "vitest";
import { publicHttps, isPrivateHost, safeUploadHeaders, UPLOAD_METHODS } from "./handlers.js";


describe("isPrivateHost", () => {
  it("flags loopback and private IPv4 ranges", () => {
    for (const host of ["localhost", "127.0.0.1", "10.1.2.3", "192.168.1.1", "172.16.0.1", "169.254.1.1"]) {
      expect(isPrivateHost(host), `${host} should be private`).toBe(true);
    }
  });

  it("flags the cloud metadata address", () => {
    expect(isPrivateHost("169.254.169.254")).toBe(true);
  });

  it("flags .local and .internal suffixes", () => {
    expect(isPrivateHost("printer.local")).toBe(true);
    expect(isPrivateHost("db.internal")).toBe(true);
  });

  it("allows ordinary public hostnames", () => {
    expect(isPrivateHost("api.worldlabs.ai")).toBe(false);
    expect(isPrivateHost("example.com")).toBe(false);
  });
});

describe("publicHttps", () => {
  it("allows https to a public host", () => {
    expect(publicHttps(new URL("https://api.worldlabs.ai/x"))).toBe(true);
  });

  it("rejects plain http", () => {
    expect(publicHttps(new URL("http://api.worldlabs.ai/x"))).toBe(false);
  });

  it("rejects https to a private host", () => {
    expect(publicHttps(new URL("https://127.0.0.1/x"))).toBe(false);
    expect(publicHttps(new URL("https://192.168.0.5/x"))).toBe(false);
  });

  it("rejects decimal and octal encodings of loopback", () => {
    // URL normalises these to 127.0.0.1 before the guard sees them
    expect(publicHttps(new URL("https://2130706433/x"))).toBe(false);
    expect(publicHttps(new URL("https://0177.0.0.1/x"))).toBe(false);
  });
});

describe("SSRF bypasses that previously got through", () => {
  it("blocks loopback reached via IPv6-mapped IPv4", () => {
    expect(publicHttps(new URL("https://[::ffff:127.0.0.1]/x"))).toBe(false);
  });

  it("blocks IPv6 loopback", () => {
    expect(publicHttps(new URL("https://[::1]/x"))).toBe(false);
    expect(isPrivateHost("::1")).toBe(true);
  });

  it("blocks IPv6 unique-local addresses (fc00::/7)", () => {
    expect(publicHttps(new URL("https://[fd00::1]/x"))).toBe(false);
    expect(publicHttps(new URL("https://[fc00::1]/x"))).toBe(false);
  });

  it("blocks IPv6 link-local addresses (fe80::/10)", () => {
    expect(publicHttps(new URL("https://[fe80::1]/x"))).toBe(false);
  });

  it("blocks the unspecified address", () => {
    expect(isPrivateHost("::")).toBe(true);
  });

  it("treats an empty host as private rather than public", () => {
    expect(isPrivateHost("")).toBe(true);
  });

  it("still allows the real Marble API host", () => {
    expect(publicHttps(new URL("https://api.worldlabs.ai/marble/v1/worlds"))).toBe(true);
  });
});

describe("safeUploadHeaders", () => {
  const enc = (obj) => encodeURIComponent(JSON.stringify(obj));

  it("passes through the content headers a signed upload needs", () => {
    const out = safeUploadHeaders(enc({ "Content-MD5": "abc==", "Cache-Control": "no-store" }));
    expect(out).toEqual({ "Content-MD5": "abc==", "Cache-Control": "no-store" });
  });

  it("drops Authorization, so a caller cannot forge credentials on our request", () => {
    const out = safeUploadHeaders(enc({ Authorization: "Bearer stolen", "Content-MD5": "abc==" }));
    expect(out).not.toHaveProperty("Authorization");
    expect(out).toEqual({ "Content-MD5": "abc==" });
  });

  it("drops arbitrary unknown headers", () => {
    expect(safeUploadHeaders(enc({ "X-Evil": "1", Cookie: "session=1" }))).toEqual({});
  });

  it("rejects values containing CR or LF (header splitting)", () => {
    expect(safeUploadHeaders(enc({ "Content-Type": "a\r\nX-Injected: 1" }))).toEqual({});
  });

  it("ignores non-string values", () => {
    expect(safeUploadHeaders(enc({ "Content-Type": { nested: true } }))).toEqual({});
  });

  it("returns {} for malformed or absent input instead of throwing", () => {
    expect(safeUploadHeaders("%7Bnot-json")).toEqual({});
    expect(safeUploadHeaders(undefined)).toEqual({});
    expect(safeUploadHeaders(enc([1, 2, 3]))).toEqual({});
    expect(safeUploadHeaders(enc(null))).toEqual({});
  });

  it("matches the allowlist case-insensitively", () => {
    expect(safeUploadHeaders(enc({ "content-type": "image/jpeg" }))).toEqual({ "content-type": "image/jpeg" });
  });
});

describe("UPLOAD_METHODS", () => {
  it("permits only PUT and POST", () => {
    expect([...UPLOAD_METHODS].sort()).toEqual(["POST", "PUT"]);
  });

  it("excludes methods that could reach unintended endpoints", () => {
    for (const m of ["GET", "DELETE", "PATCH", "TRACE", "CONNECT"]) {
      expect(UPLOAD_METHODS.has(m), `${m} must not be allowed`).toBe(false);
    }
  });
});
