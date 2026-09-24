// ---------- World Labs Marble interactive tour ----------
// The key is stored in this browser's localStorage (see lib/settings.js) so it
// survives a refresh. A server-side WORLDLABS_API_KEY in .env takes precedence
// and keeps the key out of the browser entirely.
// Calls go through the local proxy when one exists, and straight to
// api.worldlabs.ai when it does not (GitHub Pages). See lib/backend.js.

import { marbleBase, hasBackend, detectBackend } from "./backend.js";

// Kept for compatibility; prefer marbleBase(), which is mode-aware.
export const WORLDLABS_BASE = "/api/marble";

export function normalizeWorldLabsKey(value) {
  return String(value || "")
    .replace(/^\s*WLT-Api-Key\s*:\s*/i, "")
    .replace(/["'\s]/g, "")
    .trim();
}

/**
 * Reports how Marble calls will be made. Unlike the old version this never
 * throws: having no backend is a supported mode, not a failure.
 */
export async function worldlabsCheckProxy() {
  const info = await detectBackend();
  return { ok: true, ...info };
}

// Keep uploads small and fast (also stays under serverless request limits).

export async function worldlabsPrepareUpload(apiKey, fileName, extension) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["WLT-Api-Key"] = apiKey;
  const response = await fetch(`${await marbleBase()}/media-assets:prepare_upload`, {
    method: "POST",
    headers,
    body: JSON.stringify({ file_name: fileName, kind: "image", extension }),
  });
  if (!response.ok) throw await worldlabsApiError(response, "Upload preparation failed");
  return response.json();
}

export async function worldlabsUploadFile(uploadInfo, blob) {
  const method = uploadInfo.upload_method || "PUT";
  const required = uploadInfo.required_headers || {};

  // Direct mode: PUT straight at the signed storage URL. Whether that succeeds
  // depends on the storage bucket's own CORS policy, which is out of our hands
  // — worldlabsBrowserError explains the failure if it blocks us.
  if (!(await hasBackend())) {
    const response = await fetch(uploadInfo.upload_url, {
      method,
      headers: { "Content-Type": blob.type || "image/jpeg", ...required },
      body: blob,
    });
    if (!response.ok) throw await worldlabsApiError(response, "Image upload failed");
    return;
  }

  const response = await fetch("/api/marble-upload", {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "x-upload-url": encodeURIComponent(uploadInfo.upload_url),
      "x-upload-method": method,
      "x-upload-headers": encodeURIComponent(JSON.stringify(required)),
    },
    body: blob,
  });
  if (!response.ok) throw await worldlabsApiError(response, "Image upload failed");
}

export async function worldlabsGenerateWorld(apiKey, mediaAssetId, displayName, textPrompt) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["WLT-Api-Key"] = apiKey;
  const response = await fetch(`${await marbleBase()}/worlds:generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      display_name: String(displayName || "EstateFlow property").slice(0, 64),
      model: "marble-1.1",
      world_prompt: {
        type: "image",
        image_prompt: { source: "media_asset", media_asset_id: mediaAssetId },
        text_prompt: textPrompt || undefined,
      },
    }),
  });
  if (!response.ok) throw await worldlabsApiError(response, "World generation failed");
  return response.json();
}

export async function worldlabsPollOperation(apiKey, operationId, { intervalMs = 5000, timeoutMs = 12 * 60 * 1000 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const headers = apiKey ? { "WLT-Api-Key": apiKey } : {};
    const response = await fetch(`${await marbleBase()}/operations/${operationId}`, { headers });
    if (!response.ok) throw await worldlabsApiError(response, "World status check failed");
    const operation = await response.json();
    if (operation.done) {
      if (operation.error) throw new Error(operation.error.message || "World Labs generation failed");
      const result = operation.response || {};
      // The World API may return only { world_id } when the operation completes.
      // Fetch the full world object so the UI has the panorama/thumbnail assets.
      if (result.world_id) {
        const worldHeaders = apiKey ? { "WLT-Api-Key": apiKey } : {};
        const worldResponse = await fetch(`${await marbleBase()}/worlds/${encodeURIComponent(result.world_id)}`, { headers: worldHeaders });
        if (!worldResponse.ok) throw await worldlabsApiError(worldResponse, "World retrieval failed");
        return worldResponse.json();
      }
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("World Labs generation timed out");
}

export async function worldlabsApiError(response, fallback) {
  if (response.status === 404 && !/json/i.test(response.headers.get("content-type") || "")) {
    return new Error("The Marble proxy isn't running. Add marbleProxy() to vite.config.js (file: marble-proxy.js), then restart npm run dev.");
  }
  if (response.status === 401) {
    return new Error(`${fallback} (401): World Labs rejected this API key. Generate a new key at platform.worldlabs.ai/api-keys and paste it without quotes or spaces.`);
  }
  let detail = "";
  try {
    const body = await response.json();
    detail = Array.isArray(body.detail)
      ? body.detail.map((item) => `${Array.isArray(item.loc) ? item.loc.join(".") : "request"}: ${item.msg}`).join("; ")
      : body.error?.message || body.message || body.error || body.detail || "";
  } catch {
    detail = (await response.text()).slice(0, 240);
  }
  return new Error(`${fallback} (${response.status})${detail ? `: ${detail}` : ""}`);
}

export function worldlabsBrowserError(error) {
  if (error instanceof TypeError && /fetch/i.test(error.message || "")) {
    // A TypeError from fetch is what a CORS rejection looks like to JavaScript;
    // the browser deliberately withholds the detail.
    return "The browser could not complete that request. This is usually the storage provider refusing a direct browser upload. Running the app with its own backend (npm run dev, or a Vercel deployment) avoids it.";
  }
  return error.message || "World Labs request failed";
}
