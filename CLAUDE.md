# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TurboTok

Static, dependency-free web app (no build step in this repo). Served as plain
files — a TikTok API v2 control center: OAuth, video publishing, scope builder,
API console, webhook simulator. Everything is client-side simulation; there is
no server and no backend to call.

## Commands

```bash
npm install                                  # dev toolchain (ESLint, http-server)
npm run lint                                 # ESLint over test/ and eslint.config.js
npm run lint:fix                             # autofix
npm test                                     # node:test suite in test/
npm run serve                                # http-server on http://localhost:8080

node --test test/smoke.test.js               # one file
node --test --test-name-pattern 'mount point'  # one test by name
```

Node >= 20. `package.json` sets `"type": "module"`, which covers `test/` and
`eslint.config.js` — the only JavaScript sources left in the repo.

## Architecture

The deployed site is **one file**: `index.html` (~820 KB, 37 lines). It is a
self-contained bundle exported from a Claude artifact
(`<title>React Artifact</title>`): minified React plus compiled Tailwind, an
inlined `<style>` and `<script type="module">`, images as `data:` URIs, mounting
on `#root` via `createRoot(...).render(...)` at the end of line 32. It
references **no** local files — verified by test and by CI.

- Treat it as build output. Never hand-edit the minified lines; changes come
  from regenerating the bundle elsewhere and replacing the file wholesale.
- `turbotok-site.html` is a byte-identical copy. Regenerate both together — the
  test suite and CI both fail on drift.
- Both files are in ESLint's `ignores`, so nothing lints them. There is no
  bundler, no npm build script, and no source for the bundle in this repo.

The root `*.png` files (icons, watermark) are unreferenced source art, kept for
rebranding rather than loaded by anything.

A separate hand-written control center (`app.js`, `styles.css`, `assets/`) used
to sit alongside the bundle. Nothing loaded it — the markup with the `on*`
handlers and element ids it expected was never in the repo — so it was removed.
It is still reachable in git history if it is ever wanted back.

## Tests

`test/smoke.test.js` reads `index.html` as text — there is no DOM and no jsdom.
It asserts the bundle has a `#root` mount point, ships a script, actually calls
`createRoot(...).render(...)`, resolves every local `src`/`href` on disk, and
matches `turbotok-site.html` byte for byte.

These are structural checks on the bundle, not behavioral ones: they catch a
truncated, unmounted, or half-copied export, not a broken OAuth flow.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: `npm ci`,
`npm run lint`, `npm test`, then `cmp index.html turbotok-site.html`. Keep the
tree green — these are the only automated checks the project has.

## Credentials

TikTok `Client Key` / `Client Secret` belong in the UI's credentials store
(`localStorage` keys `turbotok_client_*`) — never in source, and never as
"default" values in a reset handler.

A client key and secret were once hardcoded in the removed `app.js` and remain
reachable in git history (commit `f0c40d3`). They have since been rotated in the
TikTok developer console, so those strings are dead — leave them in history and
never add the live replacements to source.
