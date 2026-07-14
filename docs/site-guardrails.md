# Site Guardrails

Diese Regeln sichern die technische Qualität der Website ab, ohne das sichtbare Design zu verändern.

## Build

- `npm run build` minifiziert zuerst `src/scripts/main.js` nach `static/main.min.js`.
- Danach baut Astro nach `public/`.
- Anschliessend validiert `scripts/validate-site.mjs` den generierten Output.
- Zum Schluss werden die CSP-Hashes in `.htaccess` aktualisiert.

## Automatisch geprüfte Regeln

- `html lang="de-CH"`
- moderner `viewport`
- `title`, `description`, `canonical`
- kompakte Seitentitel und eindeutige Titel/Descriptions
- Canonical-URL passend zur tatsächlich gebauten Route
- `hreflang="de-CH"` und `x-default`
- Open Graph und Twitter Cards
- genau eine `H1`
- JSON-LD vorhanden und mit der Canonical-URL der Seite verknüpft
- keine `SearchAction`, solange keine Suche existiert
- `img` mit `width`, `height` und `alt`
- Mobile-Menü mit `aria-label`, `aria-controls` und `aria-expanded`
- vollständige Sitemap-Parität ohne `noindex`- oder verwaiste URLs
- funktionierende interne Links und mindestens ein interner Verweis auf jede indexierbare Seite
- explizite Freigabe der zentralen OpenAI-Crawler in `robots.txt`
- Verlinkung von `llms.txt` und `llms-full.txt` im Dokumentkopf
- Trailing-Slash-Konsistenz in `llms.txt` und `llms-full.txt`

## Inhalte und Struktur

- Hauptseiten sollen visuell stabil bleiben.
- Unterseiten nutzen gemeinsame Hero- und CTA-Muster über `global.css`.
- Wiederkehrende Kartenstile laufen zentral über `.value-card`.

## Bei Änderungen

- Nach Anpassungen an `src/scripts/main.js` immer neu bauen, damit `static/main.min.js` synchron bleibt.
- Neue Seiten sollen die vorhandenen Layout- und Meta-Konventionen übernehmen.
- Neue Bild-Assets auf Dimensionen, `alt`-Text und passendes Ladeverhalten prüfen.
