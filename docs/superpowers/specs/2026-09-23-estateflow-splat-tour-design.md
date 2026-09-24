# EstateFlow — Persistent State & Walkable Splat Tours

**Date:** 2026-09-23
**Status:** Approved for planning

## Problem

EstateFlow loses everything on refresh, and its "3D tour" cannot be moved through.

**Nothing persists.** The project contains zero calls to `localStorage`,
`sessionStorage`, or `indexedDB`. All application state lives in 20 `useState`
hooks in `App.jsx`. A page refresh discards the JavaScript context and
re-initialises every hook to its empty default. Listings (`App.jsx:1123`), the
Marble API key (`App.jsx:881`), and generated worlds (`App.jsx:884`) all vanish.
The key's volatility is deliberate — `App.jsx:678` states it is "never persisted
by the app" — so persisting it reverses an intentional decision.

**The tour does not move.** `PanoViewer` (`App.jsx:820`) maps
`assets.imagery.pano_url` onto the inside of a sphere with the camera fixed at
the centre. The viewer can look around but cannot travel. This is a 360° photo,
not a space.

**The splat is already available and ignored.** The Marble API returns Gaussian
splat assets that the application never reads:

```json
"assets": {
  "splats": {
    "spz_urls": { "500k": "…", "100k": "…", "full_res": "…" },
    "semantics_metadata": { "metric_scale_factor": 1.23, "ground_plane_offset": 0.42 }
  },
  "pano_url": "…",
  "thumbnail_url": "…"
}
```

`metric_scale_factor` and `ground_plane_offset` exist precisely to place a splat
at correct real-world scale with a known floor height.

**Unresolved field-path discrepancy.** The code reads
`assets.imagery.pano_url` (`App.jsx:963`) while the published documentation
describes `assets.pano_url`. One of the two is wrong, and if it is the code,
the existing panorama view is already broken against the current API. The
implementation must log an actual world response and confirm the real shape
before relying on either path. This also affects the fallback behaviour
described under Error handling.

## Goals

1. Listings, photos, and generated worlds survive a refresh.
2. The API key is entered in-app and remembered.
3. A photo becomes a world the viewer walks through in first person.
4. The demo runs with no key, no network, and no wait.
5. `App.jsx` stops being a 2,307-line file.

## Non-goals

Accounts, authentication, a server database, multi-user support, rate limiting,
and cost controls. The "Create account" button, Public Listings, and the AI
disclosure modal remain non-functional placeholders that demonstrate intended
shape.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| API key storage | Browser `localStorage` | Satisfies the in-app settings requirement. Accepted risk: readable by any XSS, exposed on shared machines. Unsuitable for production. |
| Movement | First-person walk | Only mode that demonstrates travelling through a house from one photo. |
| Demo fallback | Built-in Sample Property | Removes the API, credits, and multi-minute wait from the critical demo path. |
| File structure | Full refactor before features | Clean base. Costs upfront work with no visible feature. |
| Renderer | `@sparkjsdev/spark` | Built by World Labs, reads `.spz` natively, renders through the already-installed three.js. |

## Architecture

```
src/
├── App.jsx              view routing + top-level state ONLY (~150 lines)
├── theme.js             C palette, SANS, SERIF
├── lib/
│   ├── storage.js    ★  IndexedDB + localStorage
│   ├── settings.js   ★  API key read/write
│   ├── marble.js        all worldlabs* functions (moved)
│   ├── photo.js         fileToImage, scorePhoto, resizeForApi
│   ├── rooms.js         ROOM_TYPES, classifyRoomWithAI, normalizeRoomSpecs
│   ├── canvas.js        drawCover, roundRect, wrapText, drawFloorPlan
│   ├── ads.js           TEMPLATES + ad generation
│   └── download.js      downloadCanvasAsset, createImagePdf
├── screens/
│   ├── Dashboard.jsx  CreateProperty.jsx  UploadPhotos.jsx
│   ├── Results.jsx    PublicListings.jsx
│   └── Settings.jsx  ★  NEW
└── components/
    ├── TopBar.jsx  Modal.jsx  Field.jsx
    ├── AnimatedPropertyAdvisor.jsx  ThreeDPropertyTour.jsx
    ├── PanoViewer.jsx
    ├── SplatViewer.jsx     ★ NEW
    └── MarbleWorldTour.jsx ★ rewritten
```

★ = new or rewritten. All other modules are moves with imports corrected and no
logic change.

The refactor lands as its own commit, separate from every feature commit, so a
regression can be bisected to a move rather than hidden inside a feature.
Moved code that changes behaviour is a bug, not a refactor.

## Persistence

Two stores, because one does not fit.

| Data | Store | Rationale |
|---|---|---|
| API key, UI preferences | `localStorage` | Small, synchronous |
| Listings (address, price, rooms) | `localStorage` | A few KB each |
| Photos | IndexedDB | Base64 data URLs run to megabytes; localStorage's ~5MB quota fails immediately |
| World records (`world_id`, metadata) | `localStorage` | Small |
| Cached `.spz` blobs | IndexedDB | Optional; avoids repeated 30MB downloads |

**Signed URLs are not persisted.** `spz_urls` are time-limited. Storing one and
reloading later yields a 403. The durable identifier is `world_id`; the world
object is re-fetched on load to obtain fresh URLs. Saved worlds therefore remain
usable indefinitely while their URLs are treated as disposable.

`storage.js` is the only module that touches a storage API. Its interface —
`saveProperty`, `loadProperties`, `savePhotos`, `loadPhotos`, `saveWorld`,
`loadWorlds` — lets the backing store change without edits to any screen.

Quota exhaustion must surface as a visible error, never a silent write failure.

## Settings screen

Reached from `TopBar`.

- Key field with show/hide, written to `localStorage` on blur
- **Test connection** — calls `/api/marble-health`, then one cheap authenticated
  request, reporting a definite result rather than deferring failure to demo time
- **Clear key**
- **Server-key detection** — when `/api/marble-health` reports `serverKey: true`,
  the field becomes read-only and states that the server's key is in use

Copy states plainly that the key is stored unencrypted in this browser and
should not be entered on a shared machine.

## Splat viewer

**New backend route.** `/api/marble-image` rejects any response whose
content-type is not `image/*` (`handlers.js:70`) and would refuse a `.spz`.
`/api/marble-splat?url=…` is added alongside it, reusing the existing
public-HTTPS SSRF guard (`publicHttps`, `isPrivateHost`) unchanged, permitting
binary content, and **streaming** the response rather than buffering 30MB
through `Buffer.concat`.

**Camera placement** is what distinguishes a room from a floating blob:

```
metric_scale_factor  →  scale the SplatMesh so 1 unit = 1 metre
ground_plane_offset  →  locate the floor
camera.y = floor + 1.65m  →  standing eye height
```

Both values are currently discarded. Wrong values put the viewer on the ceiling
at insect scale.

**Controls.** Pointer-lock mouselook, WASD movement, shift to accelerate. Click
to capture, Esc to release, with a persistent on-screen hint — click-to-capture
is not discoverable for a non-gaming audience.

**Two demo guardrails.**

- *Progressive load.* Fetch `100k` first so geometry appears in about a second,
  then upgrade to `full_res`. A 30MB blank screen loses an audience.
- *Soft bounds.* Marble reconstructions are a bubble; beyond its edge the scene
  degrades visibly. The camera is eased back at the boundary.

Download progress is reported as a real percentage, not an indeterminate spinner.

## Demo flow

```
Sample Property ──────────────────────────► walk through it   (instant, no key)
                                                    ▲
Add home → photo → Marble generate → poll ──────────┘         (live, minutes)
                        ↓
              saved to IndexedDB → survives refresh
```

`example_spz/` moves to `public/sample/`. Vite serves static assets only from
`public/`, so the file is unreachable at its current location. The Sample
Property card then loads it with no network and no key.

**Open decision:** the sample file is 30MB. Committing it is within GitHub's
100MB limit but permanently enlarges every clone. Alternatives are `.gitignore`
plus a documented download step, or Git LFS. Recommendation is to commit it — a
demo requiring manual setup is not a demo — but the choice is the repository
owner's and is not settled by this document.

## Error handling

- Missing or rejected key → Settings screen with the specific failure, not a generic error
- Marble generation failure or timeout → per-photo error, other photos unaffected (existing `setPhotoState` pattern preserved)
- Splat download failure → error with retry; the panorama remains available as a fallback view
- WebGL unavailable → static thumbnail and an explanatory message
- Storage quota exceeded → explicit, visible failure
- Expired signed URL → transparent re-fetch by `world_id`, surfacing an error only if that also fails

## Testing

The project currently has no test framework, no test script, and no tests.

Pure logic is testable without a browser and is where automated tests pay for
themselves: `storage.js` serialisation, `settings.js`, `normalizeRoomSpecs`,
`scorePhoto`, and the `publicHttps` SSRF guard. Adding Vitest is proposed in the
implementation plan, not assumed here.

Refactor verification is behavioural: the application builds and every screen
behaves identically before and after each batch of moves.

Rendering, pointer-lock controls, and the live Marble path require manual
verification. Movement speed and eye height are tuned by feel, not computed once.

## Risks

| Risk | Mitigation |
|---|---|
| Refactor touches every screen while adding no feature | Separate commit; behaviour verified after each batch |
| Live Marble path unverifiable without a key and credits | Built against documented schema; flagged as requiring the owner's hands-on confirmation |
| First-person controls need subjective tuning | Expected; budgeted as iteration, not a single calculation |
| 30MB sample inflates the repository | Open decision recorded above |
| Splat rendering is GPU-heavy on low-end hardware | Progressive load; `100k` remains a valid terminal state |

## Sources

- [World Labs Marble API documentation](https://docs.worldlabs.ai/api)
- [Spark — Gaussian splat renderer for three.js, by World Labs](https://sparkjs.dev/)
