# Neue Referenz-/Case-Study-Seite erstellen

Schritt-für-Schritt-Anleitung für eine neue Detailseite unter `/referenzen/<slug>/`.
**Wichtigste Regel: Niemals eine Seite von Grund auf neu bauen. Immer die bestehende
Seite mit dem passendsten Aufbau kopieren und nur Inhalte sowie Projektfarben
anpassen.** So bleibt das Layout konsistent mit den anderen Projekten.

---

## 0. Passende Vorlage wählen

Die Kategorie bestimmt Inhalt und Badge-Text, aber **nicht** die Farbe. Jede Referenz
erhält eine eigene Akzentpalette, die aus ihrem Erscheinungsbild, Logo oder Interface
abgeleitet wird. Als Vorlage dient deshalb das Projekt mit dem ähnlichsten Aufbau:

| Aufbau                     | Vorlage                                   |
|----------------------------|-------------------------------------------|
| Software/App, breites Bild | `referenzen/thinktank/index.astro`        |
| KI-Lösung, breites Bild    | `referenzen/mentra/index.astro`           |
| Website, breites Bild      | `referenzen/therapie-ost/index.astro`     |
| Hochformat/Phone-Mockup    | bestehende Referenz mit Hochformat-Visual |

Die kopierte Palette danach vollständig auf die neue Referenz abstimmen. Keine
Akzentklasse allein aufgrund der Kategorie übernehmen.

---

## 1. Datei anlegen

```
src/pages/referenzen/<slug>/index.astro
```

`<slug>` = URL-tauglich, klein, mit Bindestrichen (z. B. `kunden-portal`).
Trailing Slash ist Pflicht (`build.format: 'directory'`), wird automatisch erzeugt.

Die kopierte Vorlage-Datei in den neuen Ordner legen und durcharbeiten:
`pageUrl`, `detailImage`, `detailImageAvif`, `ogImage`, das JSON-LD-`@graph`, alle
`Layout`-Props, `aria-labelledby`/`id`, Breadcrumb-Label, Titel, Lead, Stats und Features.

---

## 2. Hero-Aufbau (NICHT verändern – nur Inhalt ersetzen)

Der Hero ist ein **2-Spalten-Grid (50/50)**, das zentral in `global.css` definiert ist:

```css
.case-hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```

> ⚠️ **Warum `minmax(0, 1fr)` und nicht `1fr 1fr`?**
> `1fr` ist implizit `minmax(auto, 1fr)`. Ein langes, untrennbares Wort im Titel
> (z. B. „Wissenssystem") bläht dann die linke Spalte auf und lässt das Bild rechts
> schrumpfen. `minmax(0, 1fr)` erzwingt echte 50/50-Spalten auf allen Seiten.
> **Diese Regel niemals pro Seite überschreiben.**

Markup-Gerüst (identisch auf allen Seiten):

```html
<div class="case-hero fade-up">
  <div class="case-hero-content">
    <h1 id="<slug>-title" class="home-hero__title case-hero-title">
      Titel <span class="gradient-text">Hervorhebung</span>
    </h1>
    <p class="hero-lead case-hero-lead">Lead-Text …</p>
    <!-- optional: <div class="hero-cta-group"><a class="btn btn-primary">…</a></div> -->
  </div>

  <div class="case-hero-visual">
    <div class="case-hero-canvas case-hero-canvas--XXX">
      <button type="button"
        class="case-hero-float case-hero-float--wide lightbox-trigger"
        data-gallery={`["${detailImage}"]`} data-gallery-index="0"
        aria-label="… vergrössern">
        <picture>
          <source srcset={detailImageAvif} type="image/avif">
          <img src={detailImage} alt="…"
            width="BREITE" height="HÖHE"
            loading="eager" decoding="async" fetchpriority="high">
        </picture>
      </button>
    </div>
  </div>
</div>
```

### Titel-Umbruch
`.case-page .case-hero-title` hat global `overflow-wrap: break-word; hyphens: auto;
hyphenate-limit-chars: 10 4 4;`. Dadurch trennen sich nur lange Komposita (≥10 Zeichen)
sauber (z. B. „Wissens-system", „Verwal-tung"), kurze Wörter bleiben heil.
**Nicht pro Seite überschreiben.** Bei sehr langen Titeln den natürlichen Bindestrich
nutzen (`Video-Wissenssystem`), damit ein guter Umbruchpunkt existiert.

---

## 3. Bild-Assets

| Bildtyp                     | Klasse am `<button>`               | Verhalten            |
|-----------------------------|------------------------------------|----------------------|
| Breiter Screenshot (16:9)   | `case-hero-float case-hero-float--wide` | füllt Canvas-Breite (100%) |
| Hochformat / Phone-Mockup   | `case-hero-float` (ohne `--wide`)  | zentriert, kleiner   |

Pro Bild bereitstellen, in `static/referenzen/<slug>/`:
- `<name>.webp` (Haupt) **und** `<name>.avif` (gleiche Pixelmasse) → `<source>` + `<img>`
- `<name>-og.jpg` (Social Preview, ~1200×630 oder Bildmass) für `ogImage`
- Ein kleineres `<name>-referenzbild.webp` für die Listenkarte (siehe Schritt 5)

Pflicht am `<img>`: korrekte `width`/`height` (= echte Pixelmasse, sonst Layout-Shift +
Validierungsfehler), aussagekräftiger `alt`, `loading="eager"` und `fetchpriority="high"`
(Hero ist above the fold). `Layout`-Props `preloadImage`/`preloadImageType` auf das
AVIF setzen.

---

## 4. Seiten-CSS-Block (`<style is:global>` am Dateiende)

Nur **Farb-/Akzent-Variablen** anpassen, Struktur bleibt. Klassen-Präfix
`.case-page--<slug>` verwenden (wirkt wie scoped). Die Farben werden aus der
visuellen Identität der Referenz abgeleitet, nicht aus ihrer Kategorie:

```css
.case-page--<slug> {
  --case-accent: #2f73ff;        /* Primärfarbe der Referenz */
  --case-accent-2: #31c8c2;
  --case-accent-3: #8fe0dc;
  --case-accent-soft: rgba(47, 115, 255, 0.14);
  --case-accent-glow: rgba(47, 115, 255, 0.26);
}
/* gradient-text, stat-tool, case-hero-canvas, case-feature:hover und
   case-feature-icon svg auf dieselbe projektspezifische Palette abstimmen */
```

Die Listenkarte erhält dieselbe Palette in `src/data/references.ts`, damit Übersicht
und Detailseite visuell zusammengehören.
Die Feature-Icons greifen dieselben projektspezifischen Akzentvariablen auf.

---

## 5. In der Referenzliste registrieren — `src/data/references.ts`

Neues Objekt in `referenceEntries` einfügen (Reihenfolge egal, wird nach `sortDate`
sortiert). `badge.text` bezeichnet die Kategorie; `accent` enthält die zur Referenz
passende Hauptfarbe. Zusätzlich pflegen: `href` mit Trailing Slash, `imgSrc`,
`imageBase`, echte Bildmasse, `imgAlt`, `frame`, `domain`, Rolle, Live-Link oder
Hinweis, Jahr, `sortDate`, Titel, Kurztexte und `ariaLabel`. Liste, Pagination und
`CaseMoreReferences` beziehen diese Angaben zentral aus dieser Datei.

---

## 6. Sitemap — `astro.config.mjs`

Im `serialize(item)` einen `else if`-Zweig für die neue URL ergänzen:

```js
else if (url === 'https://www.nigredo.ch/referenzen/<slug>/') {
  item.priority = 0.65;
  item.lastmod = new Date('YYYY-MM-DD');
}
```

(Case-Study-Detailseiten = `priority 0.65`. `lastmod` = Veröffentlichungs-/Änderungsdatum.)

---

## 7. SEO / JSON-LD (`schema`-Prop)

Das `@graph` aus der Vorlage übernehmen und anpassen:
- `BreadcrumbList` (Start → Referenzen → Projektname)
- `SoftwareApplication` (bei App/KI-Tool) bzw. `Service`/`CreativeWork` (bei Website) –
  `name`, `description`, `featureList`, `screenshot`, Daten
- `WebPage` mit `breadcrumb`, `about`, `speakable`

`Layout`-Pflicht-Props: `title`, `description`, `canonical` (= `pageUrl`). Dazu OG/Twitter
+ `ogImage`/`ogImageWidth`/`ogImageHeight`. Genau **eine** `<h1>` pro Seite.

---

## 8. Bauen & prüfen

```bash
npx astro build              # baut nach public/
node scripts/validate-site.mjs   # prüft lang, meta, h1, img-Maße, JSON-LD …
```

Optisch verifizieren (Headless-Screenshot der neuen + einer bestehenden Seite vergleichen):

```bash
npm run dev   # in /tmp via Chrome --headless --screenshot prüfen, 50/50-Hero kontrollieren
```

> `npm run build` führt am Ende `indexnow.mjs` aus. Externe Suchmaschinen werden nur
> benachrichtigt, wenn `INDEXNOW_SUBMIT=true` gesetzt ist. Ein normaler lokaler Build
> bleibt daher ohne externen Ping.

---

## 9. Versionierung

Neue Referenzseite = neue user-facing Capability → **Minor-Bump** in `package.json`
(`1.5.1` → `1.6.0`). Nur bewusst und nur, wenn die Seite live geht. Reine Inhalts-/
Copy-Korrekturen an bestehenden Seiten: kein oder Patch-Bump.

---

## Checkliste

- [ ] Vorlage mit passendem Aufbau kopiert und eigene Projektpalette definiert
- [ ] `src/pages/referenzen/<slug>/index.astro` mit Inhalt, Schema, Layout-Props
- [ ] Hero-Grid/Titel-CSS **nicht** überschrieben (zentral in `global.css`)
- [ ] Bilder: webp + avif (gleiche Maße) + og.jpg + Referenzbild, `width`/`height`/`alt`
- [ ] Eintrag in `src/data/references.ts` mit Kategorie, Projektfarbe und Bilddaten
- [ ] Sitemap-Zweig in `astro.config.mjs` (priority 0.65 + lastmod)
- [ ] `astro build` + `validate-site` ohne Fehler
- [ ] Optisch gegen bestehende Seite verglichen (50/50, Bildgrösse, Projektfarben)
- [ ] Versions-Bump bewusst entschieden
