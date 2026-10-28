# Site Guardrails

Diese Regeln sichern die technische Qualität der Website ab, ohne das sichtbare Design zu verändern.

## Build

- `npm run build` minifiziert zuerst `src/scripts/main.js` nach `static/main.min.js`.
- Danach baut Astro nach `public/`.
- Anschliessend ergänzt `scripts/enrich-sitemap.mjs` die Bild-Sitemap.
- `scripts/update-csp.mjs` aktualisiert die CSP-Hashes in Quell- und Deploy-`.htaccess`.
- Danach validiert `scripts/validate-site.mjs` den generierten Output.
- IndexNow bleibt bei lokalen Builds deaktiviert; eine Übermittlung ist nur nach dem Upload sinnvoll.

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
- CSP-Freigaben für sämtliche Inline-Skripte und identische Quell-/Deploy-`.htaccess`
- explizite Freigabe der zentralen OpenAI-Crawler in `robots.txt`
- Verlinkung von `llms.txt` und `llms-full.txt` im Dokumentkopf
- Trailing-Slash-Konsistenz in `llms.txt` und `llms-full.txt`

## Inhalte und Struktur

- Hauptseiten sollen visuell stabil bleiben.
- Animationen laufen bei reduzierter Bewegung in sanfter Form weiter. Startseitenbühne und Leistungsvisualisierungen pausieren ausserhalb des sichtbaren Bereichs.
- Seitenkopf (`.page-hero`), Abschnittsköpfe (`.home-head`), Projektkarten (`.work-card`),
  offene Karten (`.open-card`) und der Abschluss (`.section-cta`) kommen zentral aus
  `src/styles/stil-2026.css`. Neue Seiten nutzen diese Bausteine statt eigener Varianten.
- Dekorative Grafiken mit Fantasie-Inhalt tragen `aria-hidden` und `data-nosnippet`.

## Bei Änderungen

- Nach Anpassungen an `src/scripts/main.js` immer neu bauen, damit `static/main.min.js` synchron bleibt.
- Neue Seiten sollen die vorhandenen Layout- und Meta-Konventionen übernehmen.
- Neue Bild-Assets auf Dimensionen, `alt`-Text und passendes Ladeverhalten prüfen.
