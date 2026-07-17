import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const sourceDir = path.join(root, 'assets-src', 'referenzen');
const outputDir = path.join(root, 'static', 'referenzen');
const widths = [720, 1080, 1440, 2160];

const projects = [
  {
    slug: 'plan-h',
    base: 'plan-h-hypnosetherapie-website-startseite-screenshot',
  },
  {
    slug: 'therapie-ost',
    base: 'therapie-ost-praxiswebsite-startseite-screenshot',
  },
  {
    slug: 'mentra',
    base: 'mentra-video-wissenssystem-app-screenshot',
  },
  {
    slug: 'thinktank',
    base: 'thinktank-wissensplattform-prozessuebersicht-screenshot',
  },
  {
    slug: 'ki-voice-agent',
    base: 'ki-voice-agent-ahv-hilfsmittel-assistent-screenshot',
  },
  {
    slug: 'happypath',
    base: 'happypath-textroom-website-startseite-screenshot',
    cropRight: 14,
  },
  {
    slug: 'dashboard-kantonsverwaltung',
    base: 'dashboard-kantonsverwaltung-verwaltungsdashboard-screenshot',
  },
];

async function writeWithBudget(pipeline, target, format, initialQuality, budget) {
  let quality = initialQuality;

  while (quality >= 30) {
    const buffer = format === 'avif'
      ? await pipeline.clone().avif({ quality, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer()
      : await pipeline.clone().webp({ quality, effort: 6, smartSubsample: true }).toBuffer();

    if (buffer.length <= budget || quality === 30) {
      await fs.writeFile(target, buffer);
      return { bytes: buffer.length, quality };
    }

    quality -= 3;
  }

  throw new Error(`Bildbudget konnte nicht eingehalten werden: ${target}`);
}

async function normalizeSource(source, cropRight = 0) {
  const metadata = await sharp(source).metadata();
  if (metadata.width === 2880 && metadata.height === 1620) return;

  const temporary = `${source}.normalized.png`;
  let sourceImage = sharp(source);
  if (cropRight > 0) {
    sourceImage = sourceImage.extract({
      left: 0,
      top: 0,
      width: metadata.width - cropRight,
      height: metadata.height,
    });
  }

  await sourceImage
    .resize(2880, 1620, {
      fit: 'cover',
      position: 'north',
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.45, m1: 0.35, m2: 0.18 })
    .toColourspace('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(temporary);

  await fs.rename(temporary, source);
}

for (const project of projects) {
  const source = path.join(sourceDir, `${project.base}.png`);
  const destination = path.join(outputDir, project.slug);
  await fs.mkdir(destination, { recursive: true });
  await normalizeSource(source, project.cropRight);

  const master = sharp(source).rotate().toColourspace('srgb');

  for (const width of widths) {
    const height = Math.round(width * 9 / 16);
    const resized = master.clone().resize(width, height, {
      fit: 'cover',
      position: 'north',
      kernel: sharp.kernel.lanczos3,
    });

    const avifTarget = path.join(destination, `${project.base}-${width}.avif`);
    const webpTarget = path.join(destination, `${project.base}-${width}.webp`);
    const avifBudget = width === 2160 ? 150_000 : Number.POSITIVE_INFINITY;
    const webpBudget = width === 2160 ? 250_000 : Number.POSITIVE_INFINITY;

    const avif = await writeWithBudget(resized, avifTarget, 'avif', 52, avifBudget);
    const webp = await writeWithBudget(resized, webpTarget, 'webp', 78, webpBudget);
    console.log(`${project.slug} ${width}px: AVIF ${Math.round(avif.bytes / 1024)} KB (q${avif.quality}), WebP ${Math.round(webp.bytes / 1024)} KB (q${webp.quality})`);
  }

  const ogTarget = path.join(destination, `${project.base}-og.jpg`);
  const ogBuffer = await master
    .clone()
    .resize(1200, 630, { fit: 'cover', position: 'north', kernel: sharp.kernel.lanczos3 })
    .jpeg({ quality: 84, progressive: true, chromaSubsampling: '4:2:0' })
    .toBuffer();

  if (ogBuffer.length > 300_000) {
    throw new Error(`OG-Bild überschreitet 300 KB: ${ogTarget}`);
  }

  await fs.writeFile(ogTarget, ogBuffer);
  console.log(`${project.slug} OG: ${Math.round(ogBuffer.length / 1024)} KB`);
}
