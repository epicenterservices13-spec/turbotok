# TurboTok - TikTok Developer Control Center & API Management Dashboard

TurboTok is an enterprise-grade control center for TikTok API v2 integration, user authentication, video publishing, automated scheduling, and real-time webhook monitoring.

---

## ⚡ Quick Start

### 1. Launch Local Web Server
```bash
python3 -m http.server 8080 --directory /data/data/com.termux/files/home/downloads/turbotok
```
Or using Node.js:
```bash
npx http-server ./turbotok -p 8080
```

### 2. Access the Application
Open your browser and navigate to:
```text
http://localhost:8080/
```

---

## 🌟 Key Features & Capabilities

### 1. TikTok OAuth 2.0 Management
* **Credentials Store**: Manage `Client Key` and `Client Secret` with local encryption storage.
* **Dual Authorization Flow**:
  * **Instant Test Sandbox**: Simulates OAuth code exchange, generating valid test `Access Tokens`, `Refresh Tokens`, and `OpenID`.
  * **Official TikTok OAuth Redirect**: Launches `https://www.tiktok.com/v2/auth/authorize/` populated with your application credentials and requested scopes.

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

## 📂 Project Structure

```text
turbotok/
├── index.html        # Single Page Control Center Interface
├── styles.css        # TikTok Glassmorphism Dark Theme Design System
├── app.js            # Interactive Application Logic & OAuth Engine
├── assets/
│   ├── logo.jpg      # TurboTok Glowing Neon Branding Icon
│   ├── thumb1.jpg    # Vertical Short Video Preview #1
│   └── thumb2.jpg    # Vertical Live Stream Preview #2
├── .agents/
│   └── skills/
│       └── turbotok/
│           └── SKILL.md # AGY Custom Skill Workflow Guide
└── README.md         # Master Documentation
```
