# Planned features and review notes

## Listing persistence and draft recovery

**Status: requested; not implemented as a new feature.** Preserve listing work
when the page is refreshed, including a listing that is still being created.
Completed listing records should be available again after refresh.

The current app already writes completed listing records to `localStorage` and
photos to IndexedDB in the visitor's browser. The listing record is only created
when the user generates the ads; an in-progress form is held in React state and
is lost on refresh. Browser storage is also local to that browser profile and
does not sync to another device or visitor.

GitHub Pages can host the front end, but it cannot provide a shared database or
server-side storage by itself. Draft recovery on the same browser can be added
with local browser storage. Shared listings across devices/users need a backend
and database (for example, a Vercel API plus a database), with an access model
so one visitor cannot read or overwrite another visitor's listings.

Possible acceptance criteria:

- Refresh during listing creation and restore the draft on the same browser.
- Preserve finalized listing records after refresh and show a visible save
  failure instead of silently losing changes.
- Decide whether listings are browser-local or account-backed and shared before
  implementing cross-device storage.

## Lightweight security review

Read-only source review of the GitHub Pages front end and the optional Vercel
backend on 2026-09-24. This is not a penetration test or a dependency audit.

- **Public backend cost exposure (review before using server-side API keys):**
  the Vercel API routes have no authentication or rate limiting. If server-side
  Anthropic or World Labs keys are configured, arbitrary visitors can call the
  proxy and consume those account credits. The README already cautions against
  sharing a keyed deployment without sign-in and usage limits.
- **DNS rebinding in backend URL checks:** the SSRF guard blocks private IP
  literals, including IPv6 forms, but checks the hostname without pinning the
  resolved address. A hostname that changes from a public to private address
  could bypass the check. Keep the backend private/unkeyed until resolution-time
  validation is added.
- **Browser-stored World Labs keys:** a visitor's key is saved in that browser's
  `localStorage`. Same-origin JavaScript can read it, and anyone using that
  browser profile can use it. This is disclosed in the app; do not put a shared
  owner key in the static Pages build.
- **Review checks:** `.env` is not tracked (only `.env.example` is); the source
  scan found no `dangerouslySetInnerHTML`, `eval`, or direct `innerHTML` use.
  The backend currently caps request bodies and allowlists upload headers and
  methods, addressing older findings recorded in the refactor plan.

No live exploit attempts were made. Run a dependency advisory audit separately
before using the optional keyed backend publicly.
