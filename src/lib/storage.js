// ---------- Persistence ----------
// Two stores, because one does not fit:
//   localStorage — settings, listings, world records. Small and synchronous.
//   IndexedDB    — photos. Base64 data URLs run to megabytes and blow the ~5MB
//                  localStorage quota almost immediately.
//
// Every storage read and write in the app goes through this module, so the
// backing store can change without touching a screen.
//
// Photos carry a live `img` (HTMLImageElement) that cannot be serialized. It is
// stripped on save and rebuilt from `dataUrl` on load — see hydratePhoto.

const LS_PROPERTIES = "estateflow.properties.v1";
const LS_WORLDS = "estateflow.worlds.v1";
const DB_NAME = "estateflow";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";

/** Raised when a write fails so callers can show it instead of losing data silently. */
export class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "StorageError";
    this.cause = cause;
  }
}

// ---------- pure helpers (unit tested) ----------

/** Strip the non-serializable `img` element; `dataUrl` is what actually persists. */
export function stripPhotoForStorage(photo) {
  const { img, ...rest } = photo;
  return rest;
}

/** True when a stored photo has enough to be rebuilt. Guards against partial writes. */
export function isRestorablePhoto(photo) {
  return Boolean(photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:") && photo.id);
}

/**
 * Persisted world records keep the durable `world_id`, never the signed asset
 * URLs — those expire, and a saved URL yields a 403 on the next page load.
 */
export function stripWorldForStorage(world) {
  if (!world || !world.world_id) return null;
  return {
    world_id: world.world_id,
    display_name: world.display_name,
    savedAt: world.savedAt || Date.now(),
  };
}

/** JSON.parse that returns a fallback instead of throwing on corrupt data. */
export function parseStored(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

// ---------- localStorage ----------

function canUseLocalStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false; // private mode / blocked site data
  }
}

function readLocal(key, fallback) {
  if (!canUseLocalStorage()) return fallback;
  try {
    return parseStored(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // QuotaExceededError and friends must surface, not vanish.
    throw new StorageError(
      "Could not save to this browser's storage. It may be full, or storage may be blocked in this window.",
      error,
    );
  }
}

export function loadProperties() {
  const value = readLocal(LS_PROPERTIES, []);
  return Array.isArray(value) ? value : [];
}

export function saveProperties(properties) {
  writeLocal(LS_PROPERTIES, properties);
}

export function loadWorlds() {
  const value = readLocal(LS_WORLDS, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function saveWorlds(worlds) {
  writeLocal(LS_WORLDS, worlds);
}

// ---------- IndexedDB (photos) ----------

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined" || indexedDB === null) {
      reject(new StorageError("IndexedDB is not available in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageError("Could not open local photo storage.", request.error));
  });
}

function runTransaction(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE, mode);
        const store = tx.objectStore(PHOTO_STORE);
        let result;
        try {
          result = work(store);
        } catch (error) {
          reject(new StorageError("Photo storage operation failed.", error));
          return;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(result && result.__request ? result.__request.result : result);
        };
        tx.onerror = () => {
          db.close();
          reject(new StorageError("Could not write photos to local storage. It may be full.", tx.error));
        };
        tx.onabort = () => {
          db.close();
          reject(new StorageError("Photo storage transaction was aborted.", tx.error));
        };
      }),
  );
}

/** Replace the stored photo set with `photos` (img stripped). */
export async function savePhotos(photos) {
  const rows = photos.filter(isRestorablePhoto).map(stripPhotoForStorage);
  await runTransaction("readwrite", (store) => {
    store.clear();
    rows.forEach((row) => store.put(row));
  });
}

/** Read stored photo rows. They still need hydratePhoto before the app can draw them. */
export async function loadStoredPhotos() {
  const rows = await runTransaction("readonly", (store) => ({ __request: store.getAll() }));
  return Array.isArray(rows) ? rows.filter(isRestorablePhoto) : [];
}

export async function clearPhotos() {
  await runTransaction("readwrite", (store) => store.clear());
}

/**
 * Rebuild the live `img` element a stored photo lost on the way in.
 * Resolves to null when the data URL no longer decodes, so one bad row cannot
 * take down the whole restore.
 */
export function hydratePhoto(row) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ...row, img });
    img.onerror = () => resolve(null);
    img.src = row.dataUrl;
  });
}

/** Hydrate a set of stored rows, dropping any that fail to decode. */
export async function hydratePhotos(rows) {
  const hydrated = await Promise.all(rows.map(hydratePhoto));
  return hydrated.filter(Boolean);
}
