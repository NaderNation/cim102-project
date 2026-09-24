# EstateFlow

Photo-to-ad-campaign studio with AI room labels, a 3D realtor hero, and World Labs Marble 3D tours.

## Run it
1. `npm install`
2. `cp .env.example .env` and add your keys (optional for Marble; needed for AI room labels)
3. `npm run dev`, then open the address the terminal prints (usually http://localhost:5173)

Using `npm run preview`? Run `npm run build` first, and again after every code change.

## Where things live
- `src/App.jsx` — view routing and top-level state
- `src/screens/` — one file per screen (Dashboard, CreateProperty, UploadPhotos, VirtualTour, Results, PublicListings)
- `src/components/` — shared UI (TopBar, Modal, Field) and the 3D viewers (ThreeDPropertyTour, PanoViewer, MarbleWorldTour)
- `src/lib/` — helpers: photos, rooms, canvas, ad templates, ad generation, downloads, Marble API client
- `src/theme.js` — colours and fonts; `src/icons.jsx` — inline icons; `src/main.jsx` — entry point
- `marble-proxy.js` / `server/handlers.js` — dev/preview backend: forwards World Labs + Claude calls so the browser never hits CORS

## Tests
`npm test` runs the unit tests once. `npm run test:watch` re-runs them as you edit.

## Put it on GitHub Pages (free demo, no server)

The app detects at runtime whether a backend exists, so **one build works in both
places**. On Pages there is no backend, so it calls api.worldlabs.ai directly and
each visitor supplies their own key.

1. Push this repo to GitHub.
2. Repo **Settings -> Pages -> Source -> GitHub Actions**. That's the only setup.
3. Push to `main`. `.github/workflows/deploy-pages.yml` builds and publishes.
4. Share `https://<user>.github.io/<repo>/`.

No secrets are configured, and none are needed — the published demo holds no keys.

**What works with no key at all:** the sample 3D walkthrough, the whole listing
flow, photo scoring, all four ad templates, room highlights, the floor plan,
PNG/JPEG/PDF download, and completed listing records saved in the current browser.
In-progress listing drafts are not saved yet. Browser-saved listings do not sync
to other browsers or devices.

**What a visitor's own key unlocks:** generating new Marble worlds from their own
photos, billed to them. They paste it into Settings; it is stored in their browser
only and sent straight to World Labs.

**What only works with a backend:** AI room labeling. Without it, room types fall
back to the dropdown you pick yourself. Anthropic keys are deliberately never
accepted in the browser.

### Caveat worth knowing
Marble uploads a photo to a signed storage URL. Whether a browser may write to that
URL directly depends on the storage provider's CORS policy, which is outside this
project's control. If direct upload is refused, generation still needs a backend —
the sample tour and everything else is unaffected. Run it locally or on Vercel to
compare.

## Put it on a real website (Vercel)
The Marble step needs a small backend, which the `api/` folder provides.
1. Push this folder to a GitHub repository.
2. In Vercel: Add New -> Project -> import the repo (it detects Vite automatically).
3. Project Settings -> Environment Variables: add `WORLDLABS_API_KEY` and `ANTHROPIC_API_KEY`, then redeploy.
4. Open your Vercel address. With a server-side key set, visitors never see or type a key.
Note: on a public site every visitor spends YOUR World Labs and Anthropic credits. Add sign-in and usage limits before sharing it widely.

## The 3D walkthrough
Marble returns a Gaussian splat (`.spz`) alongside the panorama. EstateFlow renders it with
[Spark](https://sparkjs.dev/) (World Labs' own three.js splat renderer), so you can walk through
the space rather than only look around from one point: click the scene, then W A S D to move,
mouse to look, Shift to move faster, Esc to stop.

Quality can be switched between `100k` (loads in about a second), `500k`, and `full` resolution.

### Sample property
The dashboard has a "Walk through a sample property" card that loads a pre-generated world from
`public/sample/ceramic.spz` — no API key, no credits, no waiting. That file is ~30MB and is
**not committed** (see `.gitignore`); copy your own `.spz` there to use this.

## Marble troubleshooting
- Test the proxy: open `/api/marble-health` on the same address as the app. You should see `{"ok":true,...}`.
  Anything else means the app isn't being served by this project's `vite.config.js`.
- The proxy can't work on pages hosted on claude.ai.
- World Labs API credits (platform.worldlabs.ai) are separate from Marble app credits.
- Never paste API keys into chats or commit `.env`.

## Planned features and review notes

See [docs/FEATURES.md](docs/FEATURES.md) for the listing persistence feature
request and a lightweight security review of the current demo setup.
