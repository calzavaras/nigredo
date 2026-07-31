import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');
const SITEMAP_PATH = join(PUBLIC_DIR, 'sitemap-0.xml');
const SITE_ORIGIN = 'https://www.nigredo.ch';
const IMAGE_NAMESPACE = 'http://www.google.com/schemas/sitemap-image/1.1';
const SUPPORTED_IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const DECORATIVE_ASSETS = /\/(?:android-chrome-|apple-touch-icon|favicon|mstile-|assets\/nigredo-logo-header\.)/i;

function htmlPathForPage(pageUrl) {
  const { pathname } = new URL(pageUrl);
  if (pathname === '/') return join(PUBLIC_DIR, 'index.html');
  return join(PUBLIC_DIR, decodeURIComponent(pathname).replace(/^\//, ''), 'index.html');
}

function absoluteImageUrl(src, pageUrl) {
  if (!src || src.startsWith('data:')) return undefined;

  try {
    const imageUrl = new URL(src, pageUrl);
    if (imageUrl.origin !== SITE_ORIGIN) return undefined;
    imageUrl.search = '';
    imageUrl.hash = '';
    if (!SUPPORTED_IMAGE_EXTENSIONS.test(imageUrl.pathname) || DECORATIVE_ASSETS.test(imageUrl.pathname)) {
      return undefined;
    }

    const localPath = join(PUBLIC_DIR, decodeURIComponent(imageUrl.pathname).replace(/^\//, ''));
    return existsSync(localPath) ? imageUrl.href : undefined;
  } catch {
    return undefined;
  }
}

function extractPageImages(html, pageUrl) {
  const images = new Set();
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)) {
    const imageUrl = absoluteImageUrl(match[1], pageUrl);
    if (imageUrl) images.add(imageUrl);
  }
  return [...images];
}

let sitemap = await readFile(SITEMAP_PATH, 'utf8');
sitemap = sitemap
  .replace(/\s+xmlns:image="[^"]+"/g, '')
  .replace(/<image:image>[\s\S]*?<\/image:image>/g, '');
sitemap = sitemap.replace(/<urlset\b([^>]*)>/, `<urlset$1 xmlns:image="${IMAGE_NAMESPACE}">`);

let imageCount = 0;
let pageCount = 0;
const blocks = [];
let cursor = 0;

for (const match of sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)) {
  blocks.push(sitemap.slice(cursor, match.index));
  let block = match[0];
  const pageUrl = block.match(/<loc>([^<]+)<\/loc>/)?.[1];

  if (pageUrl) {
    const htmlPath = htmlPathForPage(pageUrl);
    if (existsSync(htmlPath)) {
      const html = await readFile(htmlPath, 'utf8');
      const images = extractPageImages(html, pageUrl);
      if (images.length > 0) {
        const imageXml = images
          .map((imageUrl) => `<image:image><image:loc>${imageUrl}</image:loc></image:image>`)
          .join('');
        block = block.replace('</url>', `${imageXml}</url>`);
        imageCount += images.length;
        pageCount += 1;
      }
    }
  }

  blocks.push(block);
  cursor = match.index + match[0].length;
}

blocks.push(sitemap.slice(cursor));
await writeFile(SITEMAP_PATH, blocks.join(''));
console.log(`Sitemap: ${imageCount} Bilder auf ${pageCount} Seiten ergänzt`);
