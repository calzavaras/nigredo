import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.nigredo.ch',
  output: 'static',
  publicDir: './static',
  outDir: './public',
  integrations: [
    sitemap({
      changefreq: 'monthly',
      priority: 0.7,
      serialize(item) {
        const url = item.url;
        if (url === 'https://www.nigredo.ch/') {
          item.priority = 1.0;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/digitale-loesungen/') {
          item.priority = 0.95;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/') {
          item.priority = 0.95;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/mentra/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/seite/2/') {
          item.priority = 0.45;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/ki-voice-agent/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/dashboard-kantonsverwaltung/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/therapie-ost/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/happypath/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/plan-h/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/referenzen/thinktank/') {
          item.priority = 0.65;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/marco-calzavara/') {
          item.priority = 0.95;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/kontakt/') {
          item.priority = 0.93;
          item.lastmod = new Date('2026-07-17');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/') {
          item.priority = 0.62;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/was-kostet-eine-professionelle-website/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/wie-lange-dauert-die-erstellung-einer-professionellen-website/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/kann-ich-meine-professionelle-website-selbst-bearbeiten-und-pflegen/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/brauche-ich-eine-individuelle-website-oder-reicht-ein-baukasten/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/wird-meine-website-bei-google-gefunden/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/was-kostet-der-laufende-betrieb-einer-website/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/haeufige-fragen/was-muss-meine-website-beim-datenschutz-beachten/') {
          item.priority = 0.55;
          item.lastmod = new Date('2026-07-14');
        }
        else if (url === 'https://www.nigredo.ch/impressum/' || url === 'https://www.nigredo.ch/datenschutz/') {
          item.priority = 0.3;
          item.changefreq = 'yearly';
          item.lastmod = new Date('2026-04-28');
        }
        return item;
      },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  compressHTML: true,
});
