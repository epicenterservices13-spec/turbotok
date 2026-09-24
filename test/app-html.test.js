import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

const html = read('app.html');
const appJs = read('app.js');

// app.html is the recreated sibling markup for app.js / styles.css - the
// hand-written control center that index.html (the deployed bundle) does
// not load. It is the one page in this repo where the cross-file wiring
// checks below actually matter.

test('app.html loads app.js and styles.css', () => {
  assert.match(html, /<script[^>]+src="app\.js"/, 'app.html does not load app.js');
  assert.match(html, /<link[^>]+href="styles\.css"/, 'app.html does not load styles.css');
});

test('every local asset referenced by app.html exists on disk', () => {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(ref)) continue;
    refs.add(ref);
  }
  const missing = [...refs].filter((ref) => !existsSync(join(root, ref.replace(/^\//, ''))));
  assert.deepEqual(missing, [], `referenced but not found: ${missing.join(', ')}`);
});

test('every inline on* handler in app.html has a function in app.js', () => {
  const defined = new Set(
    [...appJs.matchAll(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1])
  );
  const skip = new Set(['event', 'this', 'window', 'document']);
  const called = new Set();
  for (const m of html.matchAll(/\son[a-z]+="([^"]*)"/g)) {
    for (const c of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!skip.has(c[1])) called.add(c[1]);
    }
  }
  const orphans = [...called].filter((n) => !defined.has(n) && !(n in globalThis));
  assert.deepEqual(orphans, [], `inline handlers with no function in app.js: ${orphans.join(', ')}`);
});

test('every element id app.js looks up (as a literal string) exists in app.html', () => {
  const ids = new Set(
    [...appJs.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
  );
  const present = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const missing = [...ids].filter((id) => !present.has(id));
  assert.deepEqual(missing, [], `app.js queries ids absent from app.html: ${missing.join(', ')}`);
});

test('app.html declares a tab-<id> target for every tab switchTab() knows about', () => {
  const tabIds = ['overview', 'credentials', 'publisher', 'scopes', 'sandbox', 'webhooks'];
  const present = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const missing = tabIds.filter((id) => !present.has(`tab-${id}`));
  assert.deepEqual(missing, [], `missing tab-<id> targets: ${missing.join(', ')}`);
});

test('app.html has a nav-item linking to every tab', () => {
  const tabIds = ['overview', 'credentials', 'publisher', 'scopes', 'sandbox', 'webhooks'];
  const missing = tabIds.filter((id) => !new RegExp(`class="nav-item[^"]*"\\s+onclick="switchTab\\('${id}'`).test(html));
  assert.deepEqual(missing, [], `missing nav-item for: ${missing.join(', ')}`);
});
