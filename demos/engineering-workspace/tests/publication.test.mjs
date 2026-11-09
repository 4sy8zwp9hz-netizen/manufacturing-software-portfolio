import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const files = ['index.html', 'styles.css', 'app.mjs', 'model.mjs'];
const source = Object.fromEntries(await Promise.all(files.map(async (name) =>
  [name, await readFile(path.join(dist, name), 'utf8')])));

test('the entry page loads only existing local files', async () => {
  const references = [...source['index.html'].matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(references.includes('styles.css'));
  assert.ok(references.includes('app.mjs'));
  for (const reference of references) {
    if (reference.startsWith('#') || reference === 'data:,') continue;
    assert.doesNotMatch(reference, /^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i, reference);
    const target = path.resolve(dist, reference);
    assert.ok(target.startsWith(dist + path.sep), `Reference stays inside demo: ${reference}`);
    await access(target);
  }
  for (const [name, text] of Object.entries(source).filter(([name]) => name.endsWith('.mjs'))) {
    for (const [, reference] of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      assert.ok(reference.startsWith('./'), `${name}: no remote or package imports`);
      await access(path.resolve(dist, reference));
    }
  }
});

test('CSP rejects backend connections, form submissions, objects, and external code', () => {
  const policy = source['index.html'].match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
  assert.ok(policy, 'Content Security Policy is present');
  const directives = new Map(policy.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values.join(' ')];
  }));
  for (const name of ['default-src', 'connect-src', 'form-action', 'object-src', 'base-uri']) {
    assert.equal(directives.get(name), "'none'", name);
  }
  assert.equal(directives.get('script-src'), "'self'");
  assert.equal(directives.get('style-src'), "'self'");
});

test('demo code contains no network calls, durable browser storage, or remote assets', () => {
  const code = source['app.mjs'] + '\n' + source['model.mjs'];
  assert.doesNotMatch(code, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/);
  assert.doesNotMatch(code, /\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\.cookie\b/);
  assert.doesNotMatch(code, /\bimport\s*\(/, 'No dynamic backend/module loading');
  for (const [name, text] of Object.entries(source)) {
    assert.doesNotMatch(text, /https?:\/\//i, `${name}: no remote endpoint or asset`);
    assert.doesNotMatch(text, /\b(?:\d{1,3}\.){3}\d{1,3}\b/, `${name}: no network addresses`);
  }
  assert.doesNotMatch(source['styles.css'], /@import\b|url\(\s*['"]?\/\//i);
  assert.doesNotMatch(source['index.html'], /<(?:iframe|object|embed|form)\b/i);
});

test('fictional data and independent-interface boundaries remain visible', () => {
  const html = source['index.html'];
  assert.match(html, /FICTIONAL DATA/);
  assert.match(html, /Fictional records\./);
  assert.match(html, /No production connection\./);
  assert.match(html, /Independent public demo/);
  assert.match(html, /Not a production interface/);
  assert.match(source['model.mjs'], /Independently invented, deterministic fixtures/);
  assert.match(source['model.mjs'], /do not represent production/);
  assert.match(source['app.mjs'], /Fictional wafer measurements/);
  assert.match(source['app.mjs'], /fictional coordinate grid/);
  assert.match(source['app.mjs'], /Fictional process-cycle observations/);
});

test('three navigation links correspond to implemented hash routes', () => {
  const html = source['index.html'];
  const app = source['app.mjs'];
  for (const [route, handler] of [['stats', 'showStats'], ['maps', 'showMaps'], ['process', 'showProcess']]) {
    assert.match(html, new RegExp(`href="#${route}"`));
    assert.match(app, new RegExp(`function ${handler}\\(`));
    assert.match(app, new RegExp(`${route}\\s*:\\s*${handler}`));
  }
  assert.match(app, /addEventListener\('hashchange',\s*render\)/);
  assert.match(html, /<main\s+id="workspace"\s+tabindex="-1"/);
  assert.match(html, /<nav\s+aria-label="Engineering tools"/);
});

test('analysis captions retain missing-data and causal-interpretation distinctions', () => {
  const app = source['app.mjs'];
  assert.match(app, /Missing measurements are not zero/);
  assert.match(app, /Missing inspection or electrical data stays missing/);
  assert.match(app, /Repeated cycles are not independent wafers/);
  assert.match(app, /does not establish causation/);
  assert.match(app, /within the observed range/);
});
