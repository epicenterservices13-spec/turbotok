# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TurboTok

Static, dependency-free web app (no build step). Served as plain files — a
TikTok API v2 control center: OAuth, video publishing, scope builder, API
console, webhook simulator. Everything is client-side simulation; no server.

## Commands

```bash
npm install                                  # dev toolchain (ESLint, http-server)
npm run lint                                 # ESLint over app.js only
npm run lint:fix                             # autofix
npm test                                     # node:test suite in test/
npm run serve                                # http-server on http://localhost:8080

node --test test/smoke.test.js               # one file
node --test --test-name-pattern 'styles.css' # one test by name
```

Node >= 20. `package.json` sets `"type": "module"` — that covers `test/` and
`eslint.config.js`; `app.js` is *not* a module (see Conventions).

## Architecture

Two unrelated codebases live side by side. Know which one you are touching.

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

**2. The earlier hand-written control center — `app.js`, `styles.css`,
`assets/`.** Vanilla DOM code with Lucide icons and Chart.js from CDN. Fully
linted and tested but orphaned: no HTML in the repo loads it. Its sibling
`index.html` (the markup with the `on*` handlers and element ids it expects)
is not in the repo. Editing it changes nothing a visitor sees.

The root `*.png` files (icons, watermark) are unreferenced source art.

## Tests

`test/smoke.test.js` reads files as text — there is no DOM, no jsdom.

- It enforces that every local `src`/`href` in `index.html` and every
  `assets/...` string in `app.js` resolves on disk, so adding a reference to an
  uncommitted file fails the suite.
- Two cross-file tests (inline `on*` handlers ↔ `app.js` functions,
  `getElementById` ids ↔ ids in the markup) detect wiring via
  `<script src="app.js">` in `index.html`. They self-skip today and activate the
  moment the bundle is wired back to `app.js` — expect real failures then,
  since the two halves were never matched.

## Conventions

- `app.js` is a classic browser script (`sourceType: 'script'`): top-level
  functions are the public API for inline `on*` handlers, so ESLint cannot see
  call sites and `no-unused-vars` is set to `vars: 'local'`. Do not convert it
  to a module or wrap it in an IIFE.
- `lucide` and `Chart` are declared ESLint globals — they arrive from CDN tags
  in the missing HTML.
- `npm run lint` currently reports one known warning (unused `method` in
  `executeApiRequest`); keep the count from growing.

## Credentials

TikTok `Client Key` / `Client Secret` belong in the UI's credentials store
(`localStorage` keys `turbotok_client_*`) — never in source. Note the existing
violation: `resetCredentials()` in `app.js` hardcodes a client key and secret as
"defaults". Do not copy that pattern, do not add more, and treat those committed
values as compromised.
