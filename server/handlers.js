import { Readable } from "node:stream";

// Shared backend for EstateFlow. Used by the Vite plugin (npm run dev / preview) and by the
// serverless function in api/ when the site is deployed (Vercel).
//   /api/marble-health   app checks the backend is there (+ whether server-side keys exist)
//   /api/marble/*        World Labs Marble API
//   /api/marble-upload   relays the signed photo upload server-side (no browser CORS)
//   /api/marble-image    relays a generated panorama image so the site can show it in 3D
//   /api/marble-splat    relays a .spz Gaussian splat so the browser can render it
//   /api/claude          Anthropic Messages API for room labeling
const MARBLE_API = process.env.WORLDLABS_API_BASE || "https://api.worldlabs.ai/marble/v1";
const CLAUDE_API = process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com/v1/messages";

const cleanKey = (value) => String(value || "")
  .replace(/^\s*WLT-Api-Key\s*:\s*/i, "")
  .replace(/[\"'\s]/g, "")
  .trim();

// Cap request bodies so one large POST cannot exhaust memory. Marble photos are
// shrunk to <=2048px client-side, so this is far above any legitimate upload.
const MAX_BODY_BYTES = 32 * 1024 * 1024;

class PayloadTooLarge extends Error {
  constructor() {
    super("Request body too large");
    this.statusCode = 413;
  }
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    return Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  }
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > MAX_BODY_BYTES) throw new PayloadTooLarge();
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

// Only public https targets are relayed (blocks localhost / private-network requests).
//
// NOTE: this is a hostname check. It cannot stop DNS rebinding, where a public
// name resolves to a private address at connect time. Closing that needs
// resolution-time pinning; it is tracked as a known gap.
const PRIVATE_V4 = /^(localhost$|127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

// Strip the brackets Node's URL keeps around IPv6 literals.
const bareHost = (h) => String(h || "").replace(/^\[|\]$/g, "").toLowerCase();

export const isPrivateHost = (h) => {
  const host = bareHost(h);
  if (!host) return true;
  if (PRIVATE_V4.test(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "::1" || host === "::") return true;
  // IPv6-mapped/compatible IPv4 (::ffff:127.0.0.1, and the hex form Node
  // normalises it to) must be judged on the embedded v4 address.
  const mapped = /^::(?:ffff:)?(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/i.exec(host);
  if (mapped) {
    if (mapped[1]) return isPrivateHost(mapped[1]);
    const hi = parseInt(mapped[2], 16);
    const lo = parseInt(mapped[3], 16);
    const v4 = [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
    return isPrivateHost(v4);
  }
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10).
  if (/^f[cd][0-9a-f]{0,2}:/i.test(host)) return true;
  if (/^fe[89ab][0-9a-f]?:/i.test(host)) return true;
  return false;
};
export const publicHttps = (u) => u.protocol === "https:" && !isPrivateHost(u.hostname);

// The browser needs to pass through the headers a signed upload URL requires,
// but spreading arbitrary client JSON into an outgoing request lets a caller
// set any header (Authorization included) on a request we originate. Allow only
// the content headers object storage actually needs.
export const UPLOAD_METHODS = new Set(["PUT", "POST"]);
const UPLOAD_HEADER_ALLOWLIST = new Set([
  "content-type", "content-md5", "content-encoding", "content-disposition",
  "cache-control", "x-goog-content-length-range", "x-amz-acl",
]);

export function safeUploadHeaders(raw) {
  let parsed;
  try {
    parsed = JSON.parse(decodeURIComponent(raw || "%7B%7D"));
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const safe = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (!UPLOAD_HEADER_ALLOWLIST.has(String(name).toLowerCase())) continue;
    if (typeof value !== "string") continue;
    if (/[\r\n]/.test(value)) continue; // no header splitting
    safe[name] = value;
  }
  return safe;
}

export function createHandler(getEnv = () => ({})) {
  const envVar = (name) => process.env[name] || getEnv()[name];
  return async function handle(req, res, next) {
    const path = (req.url || "").split("?")[0];
    try {
      if (path === "/api/marble-health") {
        return sendJson(res, 200, { ok: true, serverKey: Boolean(envVar("WORLDLABS_API_KEY")), claudeKey: Boolean(envVar("ANTHROPIC_API_KEY")) });
      }
      if (path === "/api/claude" && req.method === "POST") {
        const key = envVar("ANTHROPIC_API_KEY");
        if (!key) return sendJson(res, 500, { error: { message: "Set ANTHROPIC_API_KEY on the server and restart." } });
        const r = await fetch(CLAUDE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: await readBody(req),
        });
        res.statusCode = r.status;
        res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
        return res.end(Buffer.from(await r.arrayBuffer()));
      }
      if (path === "/api/marble-upload" && req.method === "POST") {
        const url = new URL(decodeURIComponent(req.headers["x-upload-url"] || ""));
        if (!publicHttps(url)) { res.statusCode = 400; return res.end("Blocked upload URL"); }
        const extra = safeUploadHeaders(req.headers["x-upload-headers"]);
        const method = String(req.headers["x-upload-method"] || "PUT").toUpperCase();
        if (!UPLOAD_METHODS.has(method)) { res.statusCode = 400; return res.end("Blocked upload method"); }
        const r = await fetch(url, {
          method,
          headers: { "Content-Type": req.headers["content-type"] || "application/octet-stream", ...extra },
          body: await readBody(req),
        });
        res.statusCode = r.status;
        return res.end(r.ok ? "" : (await r.text()).slice(0, 500));
      }
      if (path === "/api/marble-image" && req.method === "GET") {
        const url = new URL(new URLSearchParams((req.url.split("?")[1] || "")).get("url") || "");
        if (!publicHttps(url)) { res.statusCode = 400; return res.end("Blocked image URL"); }
        const r = await fetch(url);
        const type = r.headers.get("content-type") || "";
        if (!r.ok || !type.startsWith("image/")) { res.statusCode = 502; return res.end("Not an image"); }
        res.statusCode = 200;
        res.setHeader("Content-Type", type);
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.end(Buffer.from(await r.arrayBuffer()));
      }
      if (path === "/api/marble-splat" && req.method === "GET") {
        // Relays a Gaussian splat (.spz) so the browser can load it same-origin.
        // Separate from marble-image because that route requires image/* and
        // would reject binary splat data outright.
        const url = new URL(new URLSearchParams((req.url.split("?")[1] || "")).get("url") || "");
        if (!publicHttps(url)) { res.statusCode = 400; return res.end("Blocked splat URL"); }
        const upstream = await fetch(url);
        if (!upstream.ok) { res.statusCode = 502; return res.end("Splat fetch failed"); }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Cache-Control", "public, max-age=86400");
        const length = upstream.headers.get("content-length");
        if (length) res.setHeader("Content-Length", length);
        // Stream it: a full-resolution splat runs to tens of megabytes and does
        // not belong in a single Buffer.
        if (upstream.body && typeof Readable?.fromWeb === "function") {
          return void Readable.fromWeb(upstream.body).pipe(res);
        }
        return res.end(Buffer.from(await upstream.arrayBuffer()));
      }
      if (path.startsWith("/api/marble/")) {
        // Prefer a session key supplied by the browser; otherwise use the server-side .env key.
        const key = cleanKey(req.headers["wlt-api-key"] || envVar("WORLDLABS_API_KEY"));
        const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
        if (!key) return sendJson(res, 500, { error: { message: "World Labs API key is not configured. Set WORLDLABS_API_KEY in .env and restart the dev server, or enter a key in the app." } });
        const r = await fetch(`${MARBLE_API}/${req.url.slice("/api/marble/".length)}`, {
          method: req.method,
          headers: { "Content-Type": "application/json", "WLT-Api-Key": key },
          body,
        });
        res.statusCode = r.status;
        res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
        return res.end(Buffer.from(await r.arrayBuffer()));
      }
    } catch (e) {
      const status = e && e.statusCode ? e.statusCode : 502;
      return sendJson(res, status, { error: { message: `Proxy error: ${e.message}` } });
    }
    next();
  };
}
