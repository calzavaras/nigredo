/**
 * IndexNow postbuild-Script
 * Pingt nach jedem Build alle Sitemap-URLs an api.indexnow.org (Bing, Yandex, Mojeek).
 * Wird nur bei gesetzter env-Variable INDEXNOW_SUBMIT=true ausgeführt,
 * damit Testbuilds keine unnötigen Pings auslösen.
 *
 * Verwendung:
 *   INDEXNOW_SUBMIT=true node scripts/indexnow.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INDEXNOW_KEY = '447148619ec3a3e0e44793f2c8012c3d';
const HOST = 'www.nigredo.ch';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const SITEMAP_PATH = resolve(__dirname, '../public/sitemap-0.xml');

if (process.env.INDEXNOW_SUBMIT !== 'true') {
  console.log('[IndexNow] Übersprungen (INDEXNOW_SUBMIT nicht gesetzt). Zum Aktivieren: INDEXNOW_SUBMIT=true npm run build');
  process.exit(0);
}

// URLs aus der generierten Sitemap lesen
let urls = [];
try {
  const sitemap = readFileSync(SITEMAP_PATH, 'utf-8');
  const matches = sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g);
  for (const m of matches) {
    urls.push(m[1]);
  }
} catch (err) {
  console.error('[IndexNow] Sitemap nicht gefunden:', SITEMAP_PATH);
  console.error(err.message);
  process.exit(1);
}

if (!urls.length) {
  console.warn('[IndexNow] Keine URLs in der Sitemap gefunden.');
  process.exit(0);
}

console.log(`[IndexNow] ${urls.length} URLs gefunden. Sende an api.indexnow.org …`);

const body = JSON.stringify({
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
});

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
  });

  if (res.ok || res.status === 202) {
    console.log(`[IndexNow] ✓ Erfolgreich gepingt (HTTP ${res.status})`);
  } else {
    const text = await res.text().catch(() => '');
    console.warn(`[IndexNow] Antwort HTTP ${res.status}: ${text}`);
  }
} catch (err) {
  console.warn('[IndexNow] Netzwerkfehler (Build wird trotzdem abgeschlossen):', err.message);
}
