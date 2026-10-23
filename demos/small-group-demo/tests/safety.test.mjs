import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const portfolioPath = '/4sy8zwp9hz-netizen/manufacturing-software-portfolio';
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.json']);

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const sources = filesUnder(dist)
  .filter((path) => textExtensions.has(extname(path)))
  .map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const index = sources.find((file) => file.path === resolve(dist, 'index.html')).text;

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]));
}

function assertLocalAsset(reference, sourcePath) {
  assert.ok(reference && !/^(?:[a-z][\w+.-]*:|\/\/)/i.test(reference), `Asset must be local: ${reference}`);
  const pathname = decodeURIComponent(reference.split(/[?#]/)[0]);
  const target = resolve(dirname(sourcePath), pathname);
  const location = relative(dist, target);
  assert.ok(location !== '..' && !location.startsWith(`..${sep}`) && !location.startsWith(sep), `Asset escapes dist: ${reference}`);
  assert.ok(existsSync(target) && statSync(target).isFile(), `Missing local asset: ${reference}`);
}

test('page policy blocks connections and form submission and permits only local code', () => {
  const policies = [...index.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => attributes(match[0]))
    .filter((attrs) => attrs['http-equiv']?.toLowerCase() === 'content-security-policy');
  assert.equal(policies.length, 1);
  const directives = new Map(policies[0].content.split(';').filter((value) => value.trim())
    .map((value) => { const [name, ...values] = value.trim().split(/\s+/); return [name, values]; }));
  for (const name of ['default-src', 'connect-src', 'form-action', 'object-src', 'base-uri']) {
    assert.deepEqual(directives.get(name), ["'none'"], `${name} must remain disabled`);
  }
  for (const name of ['script-src', 'style-src', 'font-src']) {
    assert.deepEqual(directives.get(name), ["'self'"], `${name} must remain local`);
  }
  assert.ok(!policies[0].content.includes("'unsafe-inline'"));
  assert.ok(!policies[0].content.includes("'unsafe-eval'"));
});

test('HTML, SVG, CSS, and module asset references resolve inside the published directory', () => {
  let references = 0;
  for (const source of sources) {
    if (['.html', '.svg'].includes(extname(source.path))) {
      for (const [tag] of source.text.matchAll(/<[a-z][^>]*>/gi)) {
        const attrs = attributes(tag);
        const tagName = tag.match(/^<([a-z]+)/i)[1].toLowerCase();
        for (const [name, value] of Object.entries(attrs)) {
          if (name === 'src' || ((name === 'href' || name === 'xlink:href') && tagName !== 'a' && !value.startsWith('#'))) {
            assertLocalAsset(value, source.path);
            references += 1;
          }
        }
        assert.equal(Object.hasOwn(attrs, 'srcset'), false, 'Review any new responsive-image sources before publishing');
      }
    }
    if (extname(source.path) === '.css') {
      for (const match of source.text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) {
        assertLocalAsset(match[1], source.path);
        references += 1;
      }
      for (const match of source.text.matchAll(/@import\s+["']([^"']+)["']/gi)) {
        assertLocalAsset(match[1], source.path);
        references += 1;
      }
    }
    if (['.js', '.mjs'].includes(extname(source.path))) {
      for (const match of source.text.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']/g)) {
        assertLocalAsset(match[1], source.path);
        references += 1;
      }
    }
  }
  assert.ok(references > 0, 'The test must inspect actual published assets');
});

test('external URLs are limited to explicit public portfolio navigation', () => {
  const navigation = new Set([...index.matchAll(/<a\b[^>]*>/gi)]
    .map((match) => attributes(match[0]).href).filter((href) => href?.startsWith('https://')));
  for (const source of sources) {
    for (const [value] of source.text.matchAll(/https?:\/\/[^\s"'<>`]+/gi)) {
      // This SVG namespace identifies the document format; it is not a resource request.
      if (extname(source.path) === '.svg' && value === 'http://www.w3.org/2000/svg') continue;
      const url = new URL(value);
      assert.equal(url.origin, 'https://github.com', `Unexpected external origin in ${source.path}`);
      assert.ok(url.pathname === portfolioPath || url.pathname.startsWith(`${portfolioPath}/`));
      assert.ok(navigation.has(value), 'External URLs must be visible portfolio links, not service endpoints');
    }
  }
});

test('application code does not initiate network calls, use persistent identity, or load remote scripts', () => {
  const prohibited = [
    /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/, /\bEventSource\b/,
    /\bsendBeacon\s*\(/, /\bimport\s*\(/, /\b(?:SharedWorker|Worker)\s*\(/,
    /\bserviceWorker\b/, /\blocalStorage\b/, /\bindexedDB\b/, /\bdocument\s*(?:\.\s*cookie|\[\s*["']cookie["']\s*\])/,
    /\b(?:process\.env|import\.meta\.env)\b/,
  ];
  for (const source of sources.filter((file) => ['.html', '.js', '.mjs'].includes(extname(file.path)))) {
    for (const pattern of prohibited) assert.doesNotMatch(source.text, pattern, `Unexpected capability in ${source.path}`);
  }
  for (const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = attributes(match[1]);
    assert.ok(attrs.src, 'Scripts must be separately reviewed local files');
    assert.equal(match[2].trim(), '', 'Do not add inline script bodies');
  }
  assert.match(sources.find((file) => file.path.endsWith(`${sep}app.mjs`)).text, /\bsessionStorage\b/);
});

test('published files contain no credential bundles or private-key material', () => {
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
    /["'](?:private_key|private_key_id|client_secret|refresh_token|access_token)["']\s*:/i,
    /\bAIza[0-9A-Za-z_-]{35}\b/, /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/, /\bhttps?:\/\/[^\s/@:]+:[^\s/@]+@/,
  ];
  for (const path of filesUnder(dist)) {
    assert.doesNotMatch(path, /(?:^|[\\/])(?:\.env(?:\.[^\\/]*)?|[^\\/]+\.(?:pem|p12|pfx|key))$/i);
  }
  for (const source of sources) {
    for (const pattern of secretPatterns) assert.doesNotMatch(source.text, pattern, `Possible secret in ${source.path}`);
  }
});
