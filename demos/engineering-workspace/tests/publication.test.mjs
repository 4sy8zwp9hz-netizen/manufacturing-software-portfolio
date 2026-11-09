import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const files = ['index.html', 'styles.css', 'app.mjs', 'model.mjs'];
const source = Object.fromEntries(await Promise.all(files.map(async (name) =>
  [name, await readFile(path.join(dist, name), 'utf8')])));
const publicNavigation = new Map([
  ['https://github.com/4sy8zwp9hz-netizen/manufacturing-software-portfolio', 'Back to portfolio'],
  ['https://github.com/4sy8zwp9hz-netizen/manufacturing-software-portfolio/blob/main/case-studies/MANUFACTURING_APPLICATION_PLATFORM.md', 'Platform case study'],
]);

// Only these exact anchor destinations are navigation exceptions. The same URLs
// remain forbidden in script, image, stylesheet, or other resource attributes.
function withoutPublicNavigationHrefs(html) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => tag.replace(/(\s)href="([^"]+)"/i,
    (attribute, space, destination) => publicNavigation.has(destination) ? `${space}href="#public-navigation"` : attribute));
}

test('the entry page loads only existing local files', async () => {
  const references = [...withoutPublicNavigationHrefs(source['index.html']).matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
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
    const resourceText = name === 'index.html' ? withoutPublicNavigationHrefs(text) : text;
    assert.doesNotMatch(resourceText, /https?:\/\//i, `${name}: no remote endpoint or asset`);
    assert.doesNotMatch(text, /\b(?:\d{1,3}\.){3}\d{1,3}\b/, `${name}: no network addresses`);
  }
  assert.doesNotMatch(source['styles.css'], /@import\b|url\(\s*['"]?\/\//i);
  assert.doesNotMatch(source['index.html'], /<(?:iframe|object|embed|form)\b/i);
});

test('header provides exactly two clearly labeled public return links in the same tab', () => {
  const html = source['index.html'];
  const navigation = html.match(/<nav\b(?=[^>]*class="portfolio-nav")(?=[^>]*aria-label="Portfolio navigation")[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  assert.ok(navigation, 'Public return links have a distinct labeled navigation landmark');
  const anchors = [...navigation.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  assert.equal(anchors.length, publicNavigation.size);
  for (const [destination, label] of publicNavigation) {
    const matching = anchors.filter(([, attributes]) => attributes.match(/(?:^|\s)href="([^"]+)"/i)?.[1] === destination);
    assert.equal(matching.length, 1, `${label} is present exactly once in the header`);
    assert.equal(html.split(`href="${destination}"`).length - 1, 1, `${label} has no duplicate link`);
    const [, attributes, body] = matching[0];
    assert.doesNotMatch(attributes, /\b(?:target|download|ping)\b|\bon[a-z]+\s*=/i, 'Ordinary same-tab navigation only');
    const text = body.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(text, label);
  }
});

test('navigation exceptions cannot permit remote resources or unapproved destinations', () => {
  for (const destination of publicNavigation.keys()) {
    assert.doesNotMatch(withoutPublicNavigationHrefs(`<a href="${destination}">Return</a>`), /https?:\/\//);
    for (const resource of [`<script src="${destination}"></script>`, `<link href="${destination}">`, `<img src="${destination}">`]) {
      assert.match(withoutPublicNavigationHrefs(resource), /https?:\/\//);
    }
    assert.match(withoutPublicNavigationHrefs(`<a data-href="${destination}">Not a navigation href</a>`), /https?:\/\//);
  }
  assert.match(withoutPublicNavigationHrefs('<a href="https://example.invalid/">Unapproved</a>'), /https?:\/\//);
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
