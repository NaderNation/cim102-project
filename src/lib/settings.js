// ---------- Settings ----------
// The World Labs API key is stored in this browser's localStorage so it
// survives a refresh, replacing the previous session-only behaviour.
//
// This is a deliberate trade-off for a local demo, not a secure design:
// localStorage is readable by any script running on this origin, so an XSS
// bug or a shared machine exposes the key. A real deployment should keep the
// key server-side in .env (the backend already prefers it when present — see
// server/handlers.js) and never hand it to the browser at all.
//
// The Settings screen states this plainly to the person typing the key in.

import { normalizeWorldLabsKey } from "./marble.js";

const LS_API_KEY = "estateflow.worldlabs.key.v1";

function canUseLocalStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false; // private mode / blocked site data
  }
}

/** The saved key, or "" when absent, unreadable, or storage is blocked. */
export function loadApiKey() {
  if (!canUseLocalStorage()) return "";
  try {
    return normalizeWorldLabsKey(localStorage.getItem(LS_API_KEY) || "");
  } catch {
    return "";
  }
}

/**
 * Save the key, normalised. Saving an empty value clears it rather than
 * storing "", so loadApiKey and hasApiKey agree on what "no key" means.
 * Returns the normalised key that was stored.
 */
export function saveApiKey(value) {
  const key = normalizeWorldLabsKey(value);
  if (!canUseLocalStorage()) return key;
  try {
    if (key) localStorage.setItem(LS_API_KEY, key);
    else localStorage.removeItem(LS_API_KEY);
  } catch {
    // A key that fails to persist still works for this session; the caller
    // reads the returned value rather than relying on the write.
  }
  return key;
}

export function clearApiKey() {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.removeItem(LS_API_KEY);
  } catch {
    // nothing to clear if storage is unavailable
  }
}

export function hasApiKey() {
  return loadApiKey().length > 0;
}

/** Show a key without printing it in full: "wlt_…a91f". */
export function maskApiKey(value) {
  const key = normalizeWorldLabsKey(value);
  if (!key) return "";
  if (key.length <= 8) return "…".repeat(key.length);
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
