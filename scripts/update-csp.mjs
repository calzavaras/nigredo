import { readdir, readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const HTACCESS_SRC = join(ROOT, 'static', '.htaccess');
const HTACCESS_OUT = join(ROOT, 'public', '.htaccess');

async function* walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtml(full);
    } else if (entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script(?:\s[^>]*)?>([^<]+)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const content = m[1];
    if (content.trim().length > 0) scripts.push(content);
  }
  return scripts;
}

function sha256b64(str) {
  return createHash('sha256').update(str).digest('base64');
}

async function main() {
  const hashSet = new Set();
  for await (const file of walkHtml(PUBLIC_DIR)) {
    const html = await readFile(file, 'utf8');
    for (const script of extractInlineScripts(html)) {
      hashSet.add(sha256b64(script));
    }
  }

  const hashes = [...hashSet].map(h => `'sha256-${h}'`).join(' ');
  const count = hashSet.size;
  console.log(`CSP: ${count} inline script hash(es) found`);

  const replacement = count > 0
    ? `script-src 'self' https://cloud.umami.is ${hashes}`
    : `script-src 'self' https://cloud.umami.is`;

  for (const path of [HTACCESS_SRC, HTACCESS_OUT]) {
    let content = await readFile(path, 'utf8');
    content = content.replace(/script-src 'self'[^;]*/, replacement);
    await writeFile(path, content, 'utf8');
  }

  console.log('CSP updated in static/.htaccess and public/.htaccess');
}

main().catch(err => { console.error(err); process.exit(1); });
