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
const htmlDocuments = [];
const indexableCanonicals = new Set();
const allCanonicals = new Set();
const sitemapLocations = new Set();
const titleOwners = new Map();
const descriptionOwners = new Map();

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

function addOwner(map, value, relativePath) {
  if (!value) return;
  const owners = map.get(value) ?? [];
  owners.push(relativePath);
  map.set(value, owners);
}

function expectedCanonicalForOutput(relativePath) {
  const outputPath = relativePath.replace(/^public\//, '');
  if (outputPath === 'index.html') return `${SITE_ORIGIN}/`;
  if (outputPath === '404.html') return `${SITE_ORIGIN}/404/`;
  if (outputPath.endsWith('/index.html')) {
    return `${SITE_ORIGIN}/${outputPath.slice(0, -'index.html'.length)}`;
  }
  return `${SITE_ORIGIN}/${outputPath}`;
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

function validateJsonLd(html, relativePath, canonical) {
  let jsonLdCount = 0;
  let matchingPageNode = false;

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

    for (const type of ['WebPage', 'CollectionPage', 'ContactPage', 'AboutPage', 'FAQPage']) {
      for (const page of findSchemaNodesByType(parsed, type)) {
        if (page?.['@id'] === `${canonical}#webpage` && page?.url === canonical) {
          matchingPageNode = true;
        }
      }
    }
  }

  if (jsonLdCount === 0) {
    addError(`${relativePath}: missing JSON-LD`);
  } else if (canonical && !matchingPageNode) {
    addError(`${relativePath}: missing JSON-LD page node matching canonical ${canonical}`);
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
  } else if (title.length > 65) {
    addWarning(`${relativePath}: title length ${title.length} is above the compact 65-character guardrail`);
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
    if (relativePath !== 'public/404.html') {
      const expectedCanonical = expectedCanonicalForOutput(relativePath);
      if (canonical !== expectedCanonical) {
        addError(`${relativePath}: canonical does not match output route (${expectedCanonical})`);
      }
    }
  }

  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] ?? '';
  const isNoindex = /noindex/i.test(robots);
  if (canonical) {
    allCanonicals.add(canonical);
    htmlDocuments.push({ html, relativePath, canonical, isNoindex });
    if (isNoindex) {
      if (relativePath !== 'public/404.html') noindexCanonicals.push(canonical);
    } else {
      indexableCanonicals.add(canonical);
      addOwner(titleOwners, title, relativePath);
      addOwner(descriptionOwners, description, relativePath);
    }
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

  validateJsonLd(html, relativePath, relativePath === 'public/404.html' ? undefined : canonical);
  await validateOpenGraphImage(html, relativePath);

  for (const llmsFile of ['/llms.txt', '/llms-full.txt']) {
    if (!html.includes(`rel="alternate" type="text/plain" href="${llmsFile}"`)) {
      addError(`${relativePath}: missing LLM alternate link for ${llmsFile}`);
    }
  }

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
      sitemapLocations.add(loc);
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

  for (const canonical of indexableCanonicals) {
    if (!sitemapLocations.has(canonical)) {
      addError(`public/sitemap-0.xml: missing indexable canonical -> ${canonical}`);
    }
  }

  for (const location of sitemapLocations) {
    if (!indexableCanonicals.has(location)) {
      addError(`public/sitemap-0.xml: URL has no indexable HTML page -> ${location}`);
    }
  }
}

async function validateInternalLinks() {
  const inboundLinks = new Map([...indexableCanonicals].map((canonical) => [canonical, new Set()]));

  for (const document of htmlDocuments) {
    for (const match of document.html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
      const href = match[1].trim();
      if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) continue;

      let target;
      try {
        target = new URL(href, document.canonical);
      } catch {
        addError(`${document.relativePath}: invalid link href -> ${href}`);
        continue;
      }

      if (target.origin !== SITE_ORIGIN) continue;
      target.search = '';
      target.hash = '';
      const targetUrl = target.href;

      if (allCanonicals.has(targetUrl)) {
        if (targetUrl !== document.canonical && inboundLinks.has(targetUrl)) {
          inboundLinks.get(targetUrl).add(document.canonical);
        }
        continue;
      }

      const slashVariant = target.pathname.endsWith('/') ? undefined : `${target.origin}${target.pathname}/`;
      if (slashVariant && allCanonicals.has(slashVariant)) {
        addError(`${document.relativePath}: internal page link is missing trailing slash -> ${href}`);
        continue;
      }

      const assetPath = join(PUBLIC_DIR, decodeURIComponent(target.pathname).replace(/^\//, ''));
      if (!existsSync(assetPath)) {
        addError(`${document.relativePath}: broken internal link -> ${href}`);
      }
    }
  }

  for (const [canonical, sources] of inboundLinks) {
    if (canonical !== `${SITE_ORIGIN}/` && sources.size === 0) {
      addError(`orphan indexable page without an inbound internal link -> ${canonical}`);
    }
  }
}

function validateUniqueMetadata() {
  for (const [title, owners] of titleOwners) {
    if (owners.length > 1) {
      addError(`duplicate title "${title}" -> ${owners.join(', ')}`);
    }
  }

  for (const [description, owners] of descriptionOwners) {
    if (owners.length > 1) {
      addError(`duplicate meta description -> ${owners.join(', ')}`);
    }
  }
}

async function validateRobots() {
  const robots = await readFile(join(STATIC_DIR, 'robots.txt'), 'utf8');
  if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap-index.xml`)) {
    addError('static/robots.txt: missing canonical sitemap declaration');
  }

  for (const crawler of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot']) {
    const allowed = new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?Allow:\\s*/(?:\\s|$)`, 'i');
    if (!allowed.test(robots)) {
      addError(`static/robots.txt: ${crawler} is not explicitly allowed`);
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
  await validateInternalLinks();
  validateUniqueMetadata();
  await validateServerConfig();
  await validateRobots();

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
