// TurboTok backend - the smallest server that can do a real TikTok OAuth
// v2 token exchange. TikTok's oauth/token and oauth/revoke endpoints do not
// send CORS headers, and the client_secret must never be shipped to the
// browser bundle, so that one exchange has to happen server-side. Everything
// else the browser can compute itself; this process also proxies
// authenticated TikTok Open API calls so the API console and video
// publisher work without hitting the same CORS wall.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

const TIKTOK_HOSTS = {
  production: 'https://open.tiktokapis.com',
  sandbox: 'https://open-sandbox.tiktokapis.com',
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function readJsonBody(req, limitBytes = 5 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function forwardTokenRequest(res, grantParams) {
  try {
    const upstream = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams(grantParams),
    });
    const data = await upstream.json();
    sendJson(res, upstream.status, data);
  } catch (err) {
    sendJson(res, 502, { error: { code: 'proxy_error', message: err.message } });
  }
}

async function handleOAuthToken(req, res) {
  const { client_key, client_secret, code, redirect_uri } = await readJsonBody(req);
  if (!client_key || !client_secret || !code || !redirect_uri) {
    return sendJson(res, 400, {
      error: { code: 'invalid_request', message: 'client_key, client_secret, code and redirect_uri are required' },
    });
  }
  await forwardTokenRequest(res, { client_key, client_secret, code, redirect_uri, grant_type: 'authorization_code' });
}

async function handleOAuthRefresh(req, res) {
  const { client_key, client_secret, refresh_token } = await readJsonBody(req);
  if (!client_key || !client_secret || !refresh_token) {
    return sendJson(res, 400, {
      error: { code: 'invalid_request', message: 'client_key, client_secret and refresh_token are required' },
    });
  }
  await forwardTokenRequest(res, { client_key, client_secret, refresh_token, grant_type: 'refresh_token' });
}

async function handleOAuthRevoke(req, res) {
  const { client_key, client_secret, token } = await readJsonBody(req);
  if (!client_key || !client_secret || !token) {
    return sendJson(res, 400, {
      error: { code: 'invalid_request', message: 'client_key, client_secret and token are required' },
    });
  }
  try {
    const upstream = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key, client_secret, token }),
    });
    const data = await upstream.json().catch(() => ({}));
    sendJson(res, upstream.status, data);
  } catch (err) {
    sendJson(res, 502, { error: { code: 'proxy_error', message: err.message } });
  }
}

// Generic authenticated proxy for the rest of the TikTok Open API. Restricted
// to TikTok's own hosts and the /v2/ namespace so it can't double as an open
// HTTP relay for anything else.
async function handleApiProxy(req, res) {
  const { method, path, accessToken, body, sandbox } = await readJsonBody(req);
  if (!method || !path || !accessToken) {
    return sendJson(res, 400, {
      error: { code: 'invalid_request', message: 'method, path and accessToken are required' },
    });
  }
  if (!path.startsWith('/v2/')) {
    return sendJson(res, 400, { error: { code: 'invalid_path', message: 'path must start with /v2/' } });
  }
  const base = sandbox ? TIKTOK_HOSTS.sandbox : TIKTOK_HOSTS.production;
  try {
    const upstream = await fetch(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });
    const text = await upstream.text();
    const data = text ? JSON.parse(text) : {};
    sendJson(res, upstream.status, data);
  } catch (err) {
    sendJson(res, 502, { error: { code: 'proxy_error', message: err.message } });
  }
}

async function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/app.html' : pathname;
  const filePath = resolve(join(rootDir, requested));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const st = await stat(filePath);
    const finalPath = st.isDirectory() ? join(filePath, 'app.html') : filePath;
    const data = await readFile(finalPath);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(finalPath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const routes = {
  'POST /api/oauth/token': handleOAuthToken,
  'POST /api/oauth/refresh': handleOAuthRefresh,
  'POST /api/oauth/revoke': handleOAuthRevoke,
  'POST /api/proxy': handleApiProxy,
};

export const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { ok: true });
  }

  const handler = routes[`${req.method} ${pathname}`];
  if (handler) {
    try {
      return await handler(req, res);
    } catch (err) {
      return sendJson(res, 400, { error: { code: 'bad_request', message: err.message } });
    }
  }

  if (pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: { code: 'not_found', message: 'Unknown API route' } });
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(res, pathname);
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => {
    console.log(`TurboTok server listening on http://localhost:${PORT}`);
  });
}
