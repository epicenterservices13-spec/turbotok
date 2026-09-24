import { test } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server/server.mjs';

async function withServer(fn) {
  await new Promise((res) => server.listen(0, res));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((res) => server.close(res));
  }
}

// These tests only exercise routing, validation and static serving - no
// real network calls to TikTok are made (and none should be, in a test).

test('GET /api/health reports ok', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
});

test('POST /api/oauth/token without required fields is rejected before any network call', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_key: 'k' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error.code, 'invalid_request');
  });
});

test('POST /api/oauth/refresh without required fields is rejected', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/oauth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });
});

test('POST /api/proxy rejects paths outside the /v2/ namespace', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', path: '/evil/', accessToken: 'tok' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error.code, 'invalid_path');
  });
});

test('POST /api/proxy requires method, path and accessToken', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/v2/user/info/' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error.code, 'invalid_request');
  });
});

test('unknown /api/ routes return a JSON 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/nope`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error.code, 'not_found');
  });
});

test('non-GET/HEAD requests to unmatched routes are rejected', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/app.html`, { method: 'DELETE' });
    assert.equal(res.status, 405);
  });
});

test('GET / serves app.html', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const body = await res.text();
    assert.match(body, /<title>/i);
    assert.match(body, /src="app\.js"/);
  });
});

test('GET /styles.css is served with a CSS content type', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/styles.css`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);
  });
});

test('a path outside the project root does not escape it', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/../../etc/passwd`);
    assert.notEqual(res.status, 200);
  });
});

test('a request for a file that does not exist is a 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/does-not-exist.html`);
    assert.equal(res.status, 404);
  });
});
