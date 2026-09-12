---
name: turbotok
description: >-
  Use this skill to manage, test, configure, and automate TikTok API operations,
  OAuth token generation, video publishing, scope management, and webhooks using the TurboTok control center.
---

# TurboTok Developer & TikTok API Skill

This skill provides step-by-step procedures for operating, testing, and managing the TurboTok control center and TikTok API integrations.

## 🚀 Quick Execution Workflows

### 1. Launching the Local Server
To start the TurboTok dashboard server:
```bash
python3 -m http.server 8080 --directory /data/data/com.termux/files/home/downloads/turbotok
```
Verify the server status:
- Local URL: [http://localhost:8080/](http://localhost:8080/)
- Main Page: [index.html](file:///data/data/com.termux/files/home/downloads/turbotok/index.html)

---

## 🔑 OAuth & Credentials Workflow

1. **Setting App Credentials**:
   - Access the **Credentials & OAuth** tab.
   - Configure `Client Key` (e.g., `aw768493021tt`) and `Client Secret`.
   - Set authorized `Redirect URI` (`https://turbotok.app/oauth/callback`).

2. **Triggering OAuth Authorization**:
   - Click **Test TikTok Login**.
   - Select **Authorize Instant Test Login** to simulate sandbox token exchange.
   - Select **Launch Live TikTok.com Auth** to open official TikTok OAuth in browser.

---

## 📹 Video Direct Post Workflow

1. **Initiate Video Upload**:
   - Navigate to **Video Publisher**.
   - Input caption and hashtags in the caption field.
   - Set privacy level (`PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, `SELF_ONLY`).
   - Toggle comment, duet, and stitch permissions.
2. **Preview & Publish**:
   - Inspect caption rendering on the simulated mobile screen preview.
   - Click **Post to TikTok Now** to execute `/v2/post/publish/video/init/`.

---

## 🛠️ API Console & Webhooks Validation

1. **Testing API Endpoints**:
   - Open **API Console**.
   - Select endpoint (`GET /v2/user/info/` or `POST /v2/post/publish/video/init/`).
   - Send payload and inspect latency and JSON response body.
2. **Simulating Webhook Events**:
   - Go to **Webhooks & Events**.
   - Click **Simulate Event Trigger** to push synthetic `video.publish.complete` or `authorization.granted` logs.
