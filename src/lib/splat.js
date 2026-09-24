// ---------- Gaussian splat helpers ----------
// Marble returns splats as .spz (Niantic's compressed Gaussian format) at three
// resolutions, plus the two numbers needed to place the result at real-world
// scale. This module turns that response into something the viewer can use.

/** Standing eye height in metres. Used once metric_scale_factor is applied. */
export const EYE_HEIGHT_M = 1.65;

/** Load order: something on screen fast, then the good one. */
export const SPLAT_QUALITY_ORDER = ["100k", "500k", "full_res"];

/**
 * Pull the splat URLs out of a world object. Returns {} when the world has no
 * splats — an older world, or one still generating.
 */
export function splatUrls(world) {
  const urls = world?.assets?.splats?.spz_urls;
  return urls && typeof urls === "object" ? urls : {};
}

/**
 * Pick the best available URL at or below `quality`, falling back down the
 * ladder. Returns null when the world carries no splat at all.
 */
export function pickSplatUrl(world, quality = "100k") {
  const urls = splatUrls(world);
  const wanted = SPLAT_QUALITY_ORDER.indexOf(quality);
  const order = wanted === -1 ? SPLAT_QUALITY_ORDER : [
    SPLAT_QUALITY_ORDER[wanted],
    ...SPLAT_QUALITY_ORDER.filter((_, i) => i !== wanted),
  ];
  for (const key of order) {
    if (typeof urls[key] === "string" && urls[key]) return urls[key];
  }
  return null;
}

/** True when a world has any splat to render. */
export function hasSplat(world) {
  return pickSplatUrl(world) !== null;
}

/**
 * Scale and floor height for placing a splat.
 * metric_scale_factor converts splat units to metres; ground_plane_offset says
 * where the floor sits. Both are optional, so fall back to identity rather than
 * producing NaN and a black screen.
 */
export function splatPlacement(world) {
  const meta = world?.assets?.splats?.semantics_metadata || {};
  const scaleRaw = Number(meta.metric_scale_factor);
  const groundRaw = Number(meta.ground_plane_offset);
  const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? scaleRaw : 1;
  const ground = Number.isFinite(groundRaw) ? groundRaw : 0;
  return { scale, ground, eyeHeight: ground + EYE_HEIGHT_M };
}

/**
 * Where the viewer should fetch a splat from.
 * With a backend, route through it. Without one (GitHub Pages) fetch the signed
 * URL directly and let the storage provider's CORS policy decide.
 * Local paths — the bundled sample — are always used as-is.
 */
export function splatFetchUrl(url, { backend = true } = {}) {
  if (!url) return null;
  if (url.startsWith("/")) return url; // bundled sample, no proxy involved
  return backend ? `/api/marble-splat?url=${encodeURIComponent(url)}` : url;
}

/** Human-readable byte size for a download progress readout. */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
