# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TurboTok

Static frontend (no build step) plus one small Node backend — a TikTok API v2
control center: OAuth, video publishing, scope builder, API console, webhook
simulator. The OAuth token exchange and authenticated API calls are real,
proxied through `server/server.mjs`; the webhook simulator stays a local
simulation (there is no publicly reachable endpoint for TikTok to call back
into).

## Commands

```bash
npm install                                  # dev toolchain (ESLint, http-server)
npm run lint                                 # ESLint over app.js, server/**/*.mjs
npm run lint:fix                             # autofix
npm test                                     # node:test suite in test/
npm run serve                                # static-only, http-server on :8080 (old workflow, no /api/*)
npm run server                               # app.html + /api/* on http://localhost:8787 (real OAuth/API calls need this)

node --test test/smoke.test.js               # one file
node --test --test-name-pattern 'styles.css' # one test by name
```

Node >= 20 (uses native `fetch`). `package.json` sets `"type": "module"` —
that covers `test/`, `eslint.config.js` and `server/**/*.mjs`; `app.js` is
*not* a module (see Conventions).

## Architecture

Three unrelated pieces live side by side. Know which one you are touching.

**1. The deployed site — `index.html` (~820 KB, 37 lines).** A self-contained
bundle exported from a Claude artifact (`<title>React Artifact</title>`):
minified React + compiled Tailwind, inlined `<style>` and `<script
type="module">`, images as `data:` URIs, mounting on `#root` via
`createRoot(...).render(...)` at the end of line 32. It loads **no** local
files — not `app.js`, not `styles.css`, not `assets/`.

- Treat it as build output: never hand-edit the minified lines. Changes come
  from regenerating the bundle and replacing the file wholesale.
- `turbotok-site.html` is a byte-identical copy. Regenerate both together and
  verify with `cmp index.html turbotok-site.html`.
- Both files are in ESLint's `ignores`, so nothing lints them.
- Untouched by the OAuth/API work below — it stays a static, server-less
  bundle exactly as before.

**2. The hand-written control center — `app.html`, `app.js`, `styles.css`,
`assets/`.** Vanilla DOM code with Lucide icons and Chart.js from CDN.
`app.html` is the markup `app.js` expects (element ids, inline `on*`
handlers, `tab-<id>` sections) — it was missing from the repo; it's now
back and is the one page these files are actually meant to be viewed through.
Open it via `npm run server` (needs the backend, for real OAuth/API calls) or
`npm run serve` (static only — UI works, network calls to `/api/*` 404).

**3. The backend — `server/server.mjs`.** A dependency-free `node:http`
server (no Express): serves the static files *and* proxies TikTok API calls.
Exists only because TikTok's OAuth token/revoke endpoints send no CORS
headers and the `client_secret` must never reach browser JS — see the file's
top comment. Routes:
  - `POST /api/oauth/token` / `/refresh` / `/revoke` — form-encodes and
    forwards to `https://open.tiktokapis.com/v2/oauth/*`.
  - `POST /api/proxy` — generic authenticated relay to TikTok's Open API,
    restricted to the `/v2/` namespace and TikTok's own hosts (production or
    sandbox, picked by the `sandbox` flag) so it can't be used as an open
    relay to anything else.
  - Anything else (GET/HEAD) falls through to static file serving, rooted at
    the repo root, `/` → `app.html`.

The root `*.png` files (icons, watermark) are unreferenced source art.

## Tests

`test/smoke.test.js` reads files as text — there is no DOM, no jsdom. It only
concerns itself with `index.html` (the deployed bundle) and stays untouched by
the work below. Its two cross-file checks (inline `on*` handlers ↔ `app.js`
functions, `getElementById` ids ↔ markup ids) self-skip because `index.html`
still doesn't load `app.js` — that's intentional, per Architecture above.

`test/app-html.test.js` runs the same two cross-file checks against
`app.html` instead, unconditionally (no skip) — since that pairing is real,
a mismatch there is a genuine bug.

`test/server.test.js` spins the backend up on an ephemeral port and hits it
with `fetch`. It only covers routing, request validation and static
serving — nothing calls the real TikTok API in tests.

## Conventions

- `app.js` is a classic browser script (`sourceType: 'script'`): top-level
  functions are the public API for inline `on*` handlers, so ESLint cannot see
  call sites and `no-unused-vars` is set to `vars: 'local'`. Do not convert it
  to a module or wrap it in an IIFE.
- `lucide` and `Chart` are declared ESLint globals — they arrive from CDN
  `<script>` tags in `app.html`. `app.js` treats a failed/blocked CDN load as
  recoverable (chart init is wrapped in try/catch) rather than letting it
  abort the rest of page setup — credential/session restoration and the
  OAuth-redirect handler run before chart init for the same reason.
- `server/server.mjs` deliberately uses only `node:http`/`node:fs`/native
  `fetch` — no Express, to keep the "no new runtime dependency" spirit of the
  rest of the repo.

## Credentials

TikTok `Client Key` / `Client Secret` belong in the UI's credentials store
(`localStorage` keys `turbotok_client_*`) — never in source, and never on the
backend either (the backend is a stateless relay; it only ever sees a secret
that the browser sent it in that one request). `resetCredentials()` clears
the fields instead of filling in a look-alike default — a hardcoded key/secret
pair here would be indistinguishable from a real one and is exactly the
mistake this codebase used to make. If you ever find real-looking credentials
committed in this repo's history, treat them as compromised.

Redirect URI must exactly match what's registered in the TikTok for
Developers portal for your app. `npm run server` serves `app.html` from
`http://localhost:8787/` by default — register that (or wherever you actually
deploy it) as the app's Redirect URI, and use "Test" on the Credentials tab
to confirm it matches the page's own URL before starting the real OAuth flow.
