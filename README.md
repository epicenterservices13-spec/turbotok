# TurboTok - TikTok Developer Control Center & API Management Dashboard

TurboTok is an enterprise-grade control center for TikTok API v2 integration, user authentication, video publishing, automated scheduling, and real-time webhook monitoring.

---

## ⚡ Quick Start

### 1. Create a TikTok app
Real OAuth and API calls need a real app in the
[TikTok for Developers](https://developers.tiktok.com/) portal, with its
`Client Key` / `Client Secret` and a registered Redirect URI.

### 2. Launch the app + backend together
```bash
npm install
npm run server
```
This serves `app.html` (the control center UI) **and** the `/api/*` routes
the OAuth flow and API console need, on `http://localhost:8787/`. Register
that URL as the app's Redirect URI in the TikTok developer portal (or
whatever URL you actually deploy this to).

Static-only hosting (`npm run serve`, `http://localhost:8080/`) still works
for browsing the UI, but OAuth/API calls will fail — there's no backend to
proxy them, and TikTok's own API and OAuth endpoints don't accept direct
calls from browser JS (see `CLAUDE.md` for why).

### 3. Connect your account
Open the **Credentials** tab, paste in your Client Key/Secret and Redirect
URI, save, then **Connect TikTok** from the header. No real credentials yet?
The login modal's "Use Instant Sandbox Simulation instead" issues
fake-but-well-formed tokens so you can exercise the rest of the UI without
one.

---

## 🌟 Key Features & Capabilities

### 1. TikTok OAuth 2.0 Management
* **Credentials Store**: `Client Key` and `Client Secret` live in this browser's `localStorage` — plain, not encrypted, so only use this on a device/browser profile you trust.
* **Dual Authorization Flow**:
  * **Instant Test Sandbox**: Skips TikTok entirely and generates fake-but-well-formed test `Access Tokens`, `Refresh Tokens`, and `OpenID` locally, for exercising the UI without a real TikTok app.
  * **Official TikTok OAuth Redirect**: Sends you to the real `https://www.tiktok.com/v2/auth/authorize/`, and once you approve it, completes a real code-for-token exchange through the bundled backend (`npm run server`) — see "Backend" below.

### 2. Direct Post Video Publisher
* **Caption & Hashtags Editor**: Dynamic input supporting tags, emojis, and captions.
* **Mobile Feed Preview**: Live TikTok screen mockup rendering real-time caption updates, sound metadata, and interaction controls.
* **Granular Permissions**: Toggles for `Allow Comments`, `Allow Duet`, and `Allow Stitch`.

### 3. API Scope Manager
* Toggle and build TikTok API permission scopes (`user.info.basic`, `user.info.stats`, `video.upload`, `video.publish`, `video.list`, `research.data`).
* Dynamically constructs sanitized OAuth URLs for production deployment.

### 4. Interactive API Console & Webhooks
* Built-in HTTP client for testing `v2/post/publish/video/init/`, `v2/user/info/`, and token endpoints.
* Real-time webhook event generator (`video.publish.complete`, `authorization.granted`, `authorization.revoked`).

---

## 📐 Master Inline Developer System Prompt & Workflow Guidelines

```markdown
### SYSTEM ARCHITECTURE & INTEGRATION CONTRACT
1. Environment Configuration:
   - TikTok Production URL: https://open.tiktokapis.com/v2/
   - Sandbox Test Base URL: https://open-sandbox.tiktokapis.com/v2/

2. OAuth 2.0 Authorization Endpoint:
   - Authorize URL: GET https://www.tiktok.com/v2/auth/authorize/
   - Token Exchange Endpoint: POST https://open.tiktokapis.com/v2/oauth/token/
   - Content-Type: application/x-www-form-urlencoded

3. Video Direct Post Flow (Two-Step Initialization):
   - Step A: POST /v2/post/publish/video/init/ with video metadata & chunk specifications.
   - Step B: PUT binary video chunks to the returned upload_url.
```

---

## 🔌 Backend

`server/server.mjs` is a small, dependency-free Node server
(`node:http` only) with two jobs:

1. Serve `app.html`, `app.js`, `styles.css` and `assets/` as static files.
2. Proxy the calls that can't be made directly from browser JS:
   TikTok's `oauth/token`/`oauth/revoke` endpoints send no CORS headers (and
   the `client_secret` shouldn't reach the browser anyway), and the rest of
   the TikTok Open API has the same CORS restriction. It never stores a
   secret itself — every request carries the credentials the browser already
   has in `localStorage`, and forwards to TikTok's real production or
   sandbox host depending on the environment toggle in the sidebar.

Run it with `npm run server`; see `CLAUDE.md` for its exact routes.

---

## 🧪 Development

```bash
npm install        # install dev toolchain (ESLint, http-server)
npm run lint       # lint app.js and server/**/*.mjs
npm test           # run the test suite (app.js/app.html wiring, backend routing, index.html smoke checks)
npm run serve      # static-only file server at http://localhost:8080 (no /api/*)
npm run server     # app.html + backend together at http://localhost:8787
```

Claude Code on the web installs this toolchain automatically via
`.claude/hooks/session-start.sh`.

---

## 📂 Project Structure

```text
turbotok/
├── index.html          # Deployed bundle (build output - don't hand-edit)
├── turbotok-site.html  # Byte-identical copy of index.html
├── app.html            # Control center markup - loads app.js + styles.css
├── styles.css          # TikTok Glassmorphism Dark Theme Design System
├── app.js              # Interactive Application Logic & OAuth Engine
├── server/
│   └── server.mjs      # Static file server + TikTok OAuth/API proxy
├── assets/
│   ├── logo.jpg       # TurboTok Glowing Neon Branding Icon
│   ├── thumb1.jpg     # Vertical Short Video Preview #1
│   └── thumb2.jpg     # Vertical Live Stream Preview #2
├── test/                # node:test suite (app.js/app.html wiring, server, index.html smoke)
├── .agents/
│   └── skills/
│       └── turbotok/
│           └── SKILL.md # AGY Custom Skill Workflow Guide
└── README.md         # Master Documentation
```
