import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

const html = read('index.html');
const appJs = read('app.js');
const css = read('styles.css');

// index.html is a self-contained bundle: markup, styles and scripts are inlined
// rather than linked. The standalone app.js / styles.css are the earlier
// hand-written control center and are not loaded by it.
const linksAppJs = /<script[^>]+src="app\.js"/.test(html);

test('index.html has a mount point and inlined scripts', () => {
  assert.match(html, /id="root"/, 'no #root mount point in index.html');
  assert.ok(/<script[^>]*>/.test(html), 'index.html ships no script');
  assert.ok(html.length > 1024, 'index.html looks truncated');
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

test('app.js is syntactically valid JavaScript', () => {
  assert.doesNotThrow(() => new vm.Script(appJs, { filename: 'app.js' }));
});

test('every local asset referenced by app.js exists on disk', () => {
  const refs = [...appJs.matchAll(/['"`](assets\/[^'"`]+)['"`]/g)].map((m) => m[1]);
  const missing = refs.filter((ref) => !existsSync(join(root, ref)));
  assert.deepEqual(missing, [], `referenced but not found: ${missing.join(', ')}`);
});

test('styles.css is non-empty and has balanced braces', () => {
  assert.ok(css.trim().length > 0, 'styles.css is empty');
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  assert.equal(open, close, `unbalanced braces in styles.css: ${open} { vs ${close} }`);
});

// The two checks below only mean something once index.html actually loads
// app.js. They are skipped while the bundle stays self-contained, and start
// guarding the wiring the moment the files are linked back together.
test('every inline on* handler in index.html has a function in app.js', (t) => {
  if (!linksAppJs) return t.skip('index.html does not load app.js');
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

test('every element id app.js looks up exists in index.html', (t) => {
  if (!linksAppJs) return t.skip('index.html does not load app.js');
  const ids = new Set(
    [...appJs.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
  );
  const present = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const missing = [...ids].filter((id) => !present.has(id));
  assert.deepEqual(missing, [], `app.js queries ids absent from index.html: ${missing.join(', ')}`);
});
