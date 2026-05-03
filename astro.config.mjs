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
        // Hauptseiten
        if (item.url === 'https://www.nigredo.ch/') {
          item.priority = 1.0;
          item.lastmod = new Date('2026-04-28');
        }
        // Kern-Seiten
        else if (item.url === 'https://www.nigredo.ch/loesungen' || item.url === 'https://www.nigredo.ch/referenzen') {
          item.priority = 0.9;
          item.lastmod = new Date('2026-04-28');
        }
        // Individuelle Referenzseiten
        else if (item.url === 'https://www.nigredo.ch/referenzen/ki-voice-agent') {
          item.priority = 0.8;
          item.lastmod = new Date('2026-04-28');
        }
        else if (item.url === 'https://www.nigredo.ch/referenzen/dashboard-kantonsverwaltung') {
          item.priority = 0.8;
          item.lastmod = new Date('2026-04-28');
        }
        else if (item.url === 'https://www.nigredo.ch/referenzen/therapie-ost') {
          item.priority = 0.8;
          item.lastmod = new Date('2026-04-28');
        }
        // Sekundärseiten
        else if (item.url === 'https://www.nigredo.ch/ueber-uns') {
          item.priority = 0.8;
          item.lastmod = new Date('2026-05-03');
        }
        else if (item.url === 'https://www.nigredo.ch/kontakt') {
          item.priority = 0.8;
          item.lastmod = new Date('2026-04-28');
        }
        return item;
      },
      filter: (page) => !page.includes('/404') && !page.includes('/impressum') && !page.includes('/datenschutz'),
    }),
  ],
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
