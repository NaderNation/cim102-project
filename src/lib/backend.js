// ---------- Where do API calls go? ----------
// One build runs in two places:
//
//   proxy mode   — served by `npm run dev`, `npm run preview`, or Vercel.
//                  A backend exists at /api/*. It can hold a server-side key,
//                  so visitors may not need one of their own.
//
//   direct mode  — served by a static host such as GitHub Pages. No backend
//                  exists, so the browser calls World Labs itself using a key
//                  the visitor supplies (bring-your-own-key).
//
// Which mode applies is discovered at runtime by asking /api/marble-health,
// not decided at build time. The same dist/ therefore works in both places.
//
// Direct mode is possible because api.worldlabs.ai sends
// `access-control-allow-origin: *` and allows the WLT-Api-Key header, so a
// browser may call it from any origin.

const WORLDLABS_DIRECT = "https://api.worldlabs.ai/marble/v1";
const PROXY_BASE = "/api/marble";

/** @typedef {{ mode: "proxy" | "direct", serverKey: boolean, claudeKey: boolean }} BackendInfo */

let probe = null;

/**
 * Ask once whether a backend is present. The result is cached for the page's
 * lifetime; a backend does not appear or vanish mid-session.
 * Never rejects — a failure simply means direct mode.
 * @returns {Promise<BackendInfo>}
 */
export function detectBackend() {
  if (probe) return probe;
  probe = (async () => {
    try {
      const response = await fetch("/api/marble-health", { headers: { Accept: "application/json" } });
      // A static host answers 404 with an HTML page, which must not be
      // mistaken for a backend. Require real JSON saying ok.
      if (!response.ok) return { mode: "direct", serverKey: false, claudeKey: false };
      if (!/json/i.test(response.headers.get("content-type") || "")) {
        return { mode: "direct", serverKey: false, claudeKey: false };
      }
      const health = await response.json();
      if (!health?.ok) return { mode: "direct", serverKey: false, claudeKey: false };
      return { mode: "proxy", serverKey: Boolean(health.serverKey), claudeKey: Boolean(health.claudeKey) };
    } catch {
      return { mode: "direct", serverKey: false, claudeKey: false };
    }
  })();
  return probe;
}

/** Base URL for Marble API calls in whichever mode applies. */
export async function marbleBase() {
  const { mode } = await detectBackend();
  return mode === "proxy" ? PROXY_BASE : WORLDLABS_DIRECT;
}

/** True when a backend is relaying calls for us. */
export async function hasBackend() {
  return (await detectBackend()).mode === "proxy";
}

/**
 * True when AI room labeling can work. It needs the backend, because the
 * Anthropic API is not safely callable from a browser and a visitor's
 * Anthropic key has no business being pasted into a public page.
 */
export async function canLabelRooms() {
  const { mode, claudeKey } = await detectBackend();
  return mode === "proxy" && claudeKey;
}

/** Test seam: forget the cached probe. */
export function resetBackendDetection() {
  probe = null;
}

export const BACKEND_URLS = { WORLDLABS_DIRECT, PROXY_BASE };
