import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

// index.html is a self-contained bundle: markup, styles and scripts are inlined
// rather than linked, and images are data: URIs. It loads no local files, so
// these checks guard the shape of the bundle itself.
const html = read('index.html');

test('index.html has a mount point and inlined scripts', () => {
  assert.match(html, /id="root"/, 'no #root mount point in index.html');
  assert.ok(/<script[^>]*>/.test(html), 'index.html ships no script');
  assert.ok(html.length > 1024, 'index.html looks truncated');
});

test('index.html mounts the React app on #root', () => {
  assert.match(
    html,
    /createRoot\(\s*document\.getElementById\(\s*["']root["']\s*\)\s*\)\s*\.render\(/,
    'no createRoot(...).render(...) call - the bundle would render nothing'
  );
});

test('every local asset referenced by index.html exists on disk', () => {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(ref)) continue;
    refs.add(ref);
  }
  const missing = [...refs].filter((ref) => !existsSync(join(root, ref.replace(/^\//, ''))));
  assert.deepEqual(missing, [], `referenced but not found: ${missing.join(', ')}`);
});

// The two bundles are regenerated as a pair; drift means one was missed.
test('turbotok-site.html is a byte-identical copy of index.html', () => {
  assert.equal(read('turbotok-site.html'), html, 'turbotok-site.html has drifted from index.html');
});
