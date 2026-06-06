import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const STATIC_DIR = join(ROOT, 'static');
const HTACCESS_PATH = join(STATIC_DIR, '.htaccess');
const SITE_ORIGIN = 'https://www.nigredo.ch';

const errors = [];
const warnings = [];
const noindexCanonicals = [];
const schemaDateModifiedByUrl = new Map();

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getLocalPublicPath(url) {
  if (!url) return undefined;

  if (url.startsWith('/')) {
    return join(PUBLIC_DIR, url.split('?')[0].split('#')[0]);
  }

  try {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://www.nigredo.ch') return undefined;
    return join(PUBLIC_DIR, parsed.pathname);
  } catch {
    return undefined;
  }
}

function validateSiteUrl(value, relativePath, label, { allowAssets = false } = {}) {
  if (!value) {
    addError(`${relativePath}: missing ${label}`);
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    addError(`${relativePath}: invalid ${label} URL -> ${value}`);
    return;
  }

  if (parsed.origin !== SITE_ORIGIN) {
    addError(`${relativePath}: ${label} must use ${SITE_ORIGIN} -> ${value}`);
  }

  if (parsed.search || parsed.hash) {
    addError(`${relativePath}: ${label} must not include query or fragment -> ${value}`);
  }

  if (!allowAssets && parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
    addError(`${relativePath}: ${label} must end with a trailing slash -> ${value}`);
  }
}

function findSchemaNodesByType(node, type, results = []) {
  if (!node || typeof node !== 'object') return results;

  const nodeType = node['@type'];
  if (nodeType === type || (Array.isArray(nodeType) && nodeType.includes(type))) {
    results.push(node);
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) findSchemaNodesByType(item, type, results);
    } else {
      findSchemaNodesByType(value, type, results);
    }
  }

  return results;
}

function collectPageDateModified(parsed) {
  const candidates = [
    ...findSchemaNodesByType(parsed, 'WebPage'),
    ...findSchemaNodesByType(parsed, 'CollectionPage'),
    ...findSchemaNodesByType(parsed, 'ContactPage'),
    ...findSchemaNodesByType(parsed, 'AboutPage'),
    ...findSchemaNodesByType(parsed, 'FAQPage'),
  ];

  for (const page of candidates) {
    if (typeof page.url === 'string' && typeof page.dateModified === 'string') {
      schemaDateModifiedByUrl.set(page.url, page.dateModified);
    }
  }
}

function validateJsonLd(html, relativePath) {
  let jsonLdCount = 0;

  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    jsonLdCount += 1;

    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (error) {
      addError(`${relativePath}: invalid JSON-LD block #${jsonLdCount} (${error.message})`);
      continue;
    }

    for (const faqPage of findSchemaNodesByType(parsed, 'FAQPage')) {
      const questions = Array.isArray(faqPage.mainEntity) ? faqPage.mainEntity : [];
      for (const question of questions) {
        const answerText = question?.acceptedAnswer?.text;
        if (typeof answerText === 'string' && /<[^>]+>/.test(answerText)) {
          addError(`${relativePath}: FAQPage answer JSON-LD must be plain text`);
        }
      }
    }

    collectPageDateModified(parsed);
  }

  if (jsonLdCount === 0) {
    addError(`${relativePath}: missing JSON-LD`);
  }
}

async function validateOpenGraphImage(html, relativePath) {
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1];
  if (!ogImage) return;

  const localPath = getLocalPublicPath(ogImage);
  if (!localPath) return;

  if (!existsSync(localPath)) {
    addError(`${relativePath}: local Open Graph image does not exist (${ogImage})`);
    return;
  }

  const expectedWidth = Number(html.match(/<meta[^>]+property="og:image:width"[^>]+content="([^"]+)"/i)?.[1]);
  const expectedHeight = Number(html.match(/<meta[^>]+property="og:image:height"[^>]+content="([^"]+)"/i)?.[1]);
  if (!expectedWidth || !expectedHeight) {
    addError(`${relativePath}: Open Graph image is missing width or height`);
    return;
  }

  const metadata = await sharp(localPath).metadata();
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    addError(`${relativePath}: Open Graph image dimensions are ${metadata.width}x${metadata.height}, metadata says ${expectedWidth}x${expectedHeight}`);
  }
}

async function validateHtml(html, relativePath) {
  const isRedirectStub = /http-equiv=["']refresh["']/i.test(html);

  if (isRedirectStub) {
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    if (!canonical) {
      addError(`${relativePath}: redirect stub is missing canonical link`);
    }
    return;
  }

  const lang = html.match(/<html[^>]*lang="([^"]+)"/i)?.[1];
  if (lang !== 'de-CH') {
    addError(`${relativePath}: expected html lang="de-CH", got "${lang ?? 'missing'}"`);
  }

  const viewport = html.match(/<meta[^>]+name="viewport"[^>]+content="([^"]+)"/i)?.[1];
  if (!viewport || !viewport.includes('width=device-width')) {
    addError(`${relativePath}: missing modern viewport meta tag`);
  }

  const title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  if (!title) {
    addError(`${relativePath}: missing <title>`);
  }

  const description = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  if (!description) {
    addError(`${relativePath}: missing meta description`);
  } else if (description.length < 70 || description.length > 160) {
    addWarning(`${relativePath}: meta description length ${description.length} is outside the ideal 70-160 range`);
  }

  const themeColor = html.match(/<meta[^>]+name="theme-color"[^>]+content="([^"]+)"/i)?.[1];
  if (!themeColor) {
    addError(`${relativePath}: missing theme-color meta`);
  }

  const colorScheme = html.match(/<meta[^>]+name="color-scheme"[^>]+content="([^"]+)"/i)?.[1];
  if (!colorScheme) {
    addError(`${relativePath}: missing color-scheme meta`);
  }

  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  if (!canonical) {
    addError(`${relativePath}: missing canonical link`);
  } else {
    validateSiteUrl(canonical, relativePath, 'canonical');
  }

  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] ?? '';
  if (/noindex/i.test(robots) && canonical && relativePath !== 'public/404.html') {
    noindexCanonicals.push(canonical);
  }

  const hreflangDe = html.match(/<link[^>]+rel="alternate"[^>]+hreflang="de-CH"[^>]+href="([^"]+)"/i)?.[1];
  const hreflangDefault = html.match(/<link[^>]+rel="alternate"[^>]+hreflang="x-default"[^>]+href="([^"]+)"/i)?.[1];
  if (!hreflangDe || !hreflangDefault) {
    addError(`${relativePath}: missing hreflang alternates`);
  } else if (canonical && (hreflangDe !== canonical || hreflangDefault !== canonical)) {
    addError(`${relativePath}: hreflang URLs must match canonical`);
  } else {
    validateSiteUrl(hreflangDe, relativePath, 'hreflang de-CH');
    validateSiteUrl(hreflangDefault, relativePath, 'hreflang x-default');
  }

  for (const rel of ['prev', 'next']) {
    const url = html.match(new RegExp(`<link[^>]+rel="${rel}"[^>]+href="([^"]+)"`, 'i'))?.[1];
    if (url) validateSiteUrl(url, relativePath, `rel=${rel}`);
  }

  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  const ogDescription = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  const twitterCard = html.match(/<meta[^>]+name="twitter:card"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  const twitterTitle = html.match(/<meta[^>]+name="twitter:title"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  const twitterDescription = html.match(/<meta[^>]+name="twitter:description"[^>]+content="([^"]*)"/i)?.[1] ?? '';
  if (!ogTitle || !ogDescription) {
    addError(`${relativePath}: missing Open Graph title or description`);
  }
  const ogUrl = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i)?.[1] ?? '';
  validateSiteUrl(ogUrl, relativePath, 'Open Graph URL');
  if (!twitterCard || !twitterTitle || !twitterDescription) {
    addError(`${relativePath}: missing Twitter card metadata`);
  }

  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) {
    addError(`${relativePath}: expected exactly one <h1>, found ${h1Count}`);
  }

  validateJsonLd(html, relativePath);
  await validateOpenGraphImage(html, relativePath);

  if (/SearchAction/i.test(html) || /urlTemplate":"https:\/\/www\.nigredo\.ch\/\?q=/.test(html)) {
    addError(`${relativePath}: SearchAction schema should not be present`);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\bwidth="/i.test(tag) || !/\bheight="/i.test(tag)) {
      addError(`${relativePath}: image missing width/height -> ${tag.slice(0, 120)}`);
    }
    if (!/\balt="/i.test(tag)) {
      addError(`${relativePath}: image missing alt -> ${tag.slice(0, 120)}`);
    }
  }

  const menuButton = html.match(/<button[^>]+class="menu-toggle"[^>]*>/i)?.[0];
  if (!menuButton) {
    addError(`${relativePath}: missing mobile menu button`);
  } else {
    if (!/\baria-label="/i.test(menuButton)) {
      addError(`${relativePath}: menu button missing aria-label`);
    }
    if (!/\baria-controls="primary-navigation"/i.test(menuButton)) {
      addError(`${relativePath}: menu button missing aria-controls="primary-navigation"`);
    }
    if (!/\baria-expanded="false"/i.test(menuButton)) {
      addError(`${relativePath}: menu button missing default aria-expanded="false"`);
    }
  }
}

function validateTrailingSlashes(text, relativePath) {
  const urls = text.match(/https:\/\/www\.nigredo\.ch[^\s)"']+/g) ?? [];
  for (const url of urls) {
    if (
      url === 'https://www.nigredo.ch' ||
      url === 'https://www.nigredo.ch/' ||
      url.endsWith('.txt') ||
      url.endsWith('.xml') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.webp') ||
      url.endsWith('.avif') ||
      url.endsWith('.svg')
    ) {
      continue;
    }

    if (!url.endsWith('/')) {
      addError(`${relativePath}: URL missing trailing slash -> ${url}`);
    }
  }
}

async function validateSitemap() {
  const sitemap = await readFile(join(PUBLIC_DIR, 'sitemap-0.xml'), 'utf8');

  for (const match of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) {
      validateSiteUrl(loc, 'public/sitemap-0.xml', 'sitemap loc');
    } else {
      addError('public/sitemap-0.xml: sitemap entry is missing loc');
    }

    if (!/<lastmod>[^<]+<\/lastmod>/.test(block)) {
      addError(`public/sitemap-0.xml: sitemap entry is missing lastmod -> ${loc ?? 'unknown URL'}`);
    } else if (loc && schemaDateModifiedByUrl.has(loc)) {
      const sitemapLastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.slice(0, 10);
      const schemaDateModified = schemaDateModifiedByUrl.get(loc);
      if (sitemapLastmod !== schemaDateModified) {
        addError(`public/sitemap-0.xml: lastmod ${sitemapLastmod} does not match JSON-LD dateModified ${schemaDateModified} -> ${loc}`);
      }
    }
  }

  for (const url of [
    'https://www.nigredo.ch/impressum/',
    'https://www.nigredo.ch/datenschutz/',
  ]) {
    if (!sitemap.includes(`<loc>${url}</loc>`)) {
      addError(`public/sitemap-0.xml: missing expected legal page -> ${url}`);
    }
  }

  if (sitemap.includes('/404')) {
    addError('public/sitemap-0.xml: 404 page must not be included');
  }

  for (const canonical of noindexCanonicals) {
    if (sitemap.includes(`<loc>${canonical}</loc>`)) {
      addError(`public/sitemap-0.xml: noindex URL must not be included -> ${canonical}`);
    }
  }
}

async function validateServerConfig() {
  const htaccess = await readFile(HTACCESS_PATH, 'utf8');

  if (!/AddDefaultCharset\s+UTF-8/i.test(htaccess)) {
    addError('static/.htaccess: missing AddDefaultCharset UTF-8');
  }

  if (!/HTTP_HOST\}\s+!\^www\\\.nigredo\\\.ch\$/i.test(htaccess) || !/https:\/\/www\.nigredo\.ch%\{REQUEST_URI\}.*R=301/i.test(htaccess)) {
    addError('static/.htaccess: missing canonical www 301 redirect');
  }

  if (
    !/RewriteCond\s+%\{THE_REQUEST\}\s+\\s\/\+index\\\.html\[\\s\?\]\s+\[NC\][\s\S]*RewriteRule\s+\^index\\\.html\$\s+\/\s+\[L,R=301\]/i.test(htaccess) ||
    !/RewriteCond\s+%\{THE_REQUEST\}\s+\\s\/\+\(\.\+\)\/index\\\.html\[\\s\?\]\s+\[NC\][\s\S]*RewriteRule\s+\^\(\.\+\)\/index\\\.html\$\s+\/\$1\/\s+\[L,R=301\]/i.test(htaccess)
  ) {
    addError('static/.htaccess: missing safe canonical index.html redirects');
  }

  if (!/<Files\s+"send-mail\.php">[\s\S]*Header\s+set\s+X-Robots-Tag\s+"noindex,\s*nofollow,\s*noarchive"[\s\S]*<\/Files>/i.test(htaccess)) {
    addError('static/.htaccess: missing X-Robots-Tag for send-mail.php');
  }
}

async function main() {
  for await (const file of walk(PUBLIC_DIR)) {
    const relativePath = file.replace(`${ROOT}/`, '');
    if (/\s/.test(basename(file))) {
      addError(`${relativePath}: deploy artifact filename must not contain whitespace`);
    }

    if (!file.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    await validateHtml(html, relativePath);
  }

  await validateSitemap();
  await validateServerConfig();

  for (const file of ['llms.txt', 'llms-full.txt']) {
    const fullPath = join(STATIC_DIR, file);
    const text = await readFile(fullPath, 'utf8');
    validateTrailingSlashes(text, `static/${file}`);
    if (!text.includes('https://www.nigredo.ch/')) {
      addError(`static/${file}: missing canonical URL https://www.nigredo.ch/`);
    }
  }

  if (warnings.length > 0) {
    console.warn('Site validation warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('Site validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Site validation passed (${warnings.length} warning(s))`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
