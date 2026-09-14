# TurboTok

Static, dependency-free web app (no build step). Served as plain files.

## Commands

```bash
npm install        # dev toolchain (ESLint, http-server)
npm run lint       # ESLint over app.js
npm test           # node:test smoke suite in test/
npm run serve      # http-server on http://localhost:8080
```

## Layout

- `index.html` — the deployed site: a **self-contained bundle** with markup,
  styles and scripts inlined (mounts a React app on `#root`). It does *not*
  load `app.js` or `styles.css`.
- `turbotok-site.html` — byte-identical copy of `index.html`.
- `app.js`, `styles.css`, `assets/` — the earlier hand-written control center.
  Still linted and tested, but not referenced by `index.html`.
- `.agents/skills/turbotok/SKILL.md` — TurboTok/TikTok API workflow skill.
- `.claude/hooks/session-start.sh` — installs deps for Claude Code on the web.

## Conventions

- `app.js` is a classic browser script: top-level functions are the public API
  for inline `on*` handlers, so ESLint only checks unused *local* variables.
- The cross-file tests in `test/smoke.test.js` (inline handlers, element ids)
  skip themselves while `index.html` stays self-contained, and activate
  automatically if it is ever wired back to `app.js`.

## Credentials

TikTok `Client Key` / `Client Secret` belong in the UI's credentials store
(localStorage) — never committed. Do not add live secrets to source files.
