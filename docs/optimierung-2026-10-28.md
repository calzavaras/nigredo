# Optimierung 28.10.2026: Aufräumen, SEO, KI-Bots, Tempo

Grundlage: zwei unabhängige Prüfungen (Aufräumen/Vereinfachen sowie SEO/GEO/Ladezeit).
Gestaltung, Inhalte und Funktionen bleiben unverändert. Der Ordner `../backend` (Admin) wird nicht berührt.

## A · Aufräumen und vereinfachen

1. **Totes CSS** in `global.css` entfernen (Regeln ohne Treffer auf einer der 32 Seiten,
   Analyse auf Basis des Builds). Nachweis: berechnete Stile aller Elemente vor/nach auf
   14 Seiten × 2 Breiten identisch.
2. **Unbenutzte Dateien** löschen: `HomeArtwork.astro`, `home-digital-craft-720/1440.webp`,
   runde Porträtvarianten (`*-round*`), `nigredo-noise.png`. Das OG-Bild
   `home-digital-craft-1440.jpg` bleibt.
3. **main.js**: tote Funktionen (Akkordeon, alte Hero-Grafik, unsichtbarer Hero-Glow, Zufallswinkel
   der Kartenkante) entfernen, `main.min.js` neu erzeugen. Unsichtbares `hero-glow`-Markup aus
   allen Seiten entfernen.
4. Ungenutzte Variablen, wirkungslose Regeln und tote Komponentenregeln entfernen.
5. Nicht gelöscht (Entscheid beim Betreiber): `output/` (alte FTP-Pakete), `assets-src/`
   (Bildmaster, werden gebraucht), `docs/nigredo-seo-geo-audit.docx`.

## B · Suchmaschinen und KI-Bots

1. **Startseite JSON-LD**: ungültigen Typ `HomePage` entfernen, `primaryImageOfPage` und die
   einteilige Breadcrumb entfernen.
2. **Überschriften**: Lösungen H1 → H2 (Leistungskarten), Detailseiten «Weitere Projekte» als H2.
   Optik bleibt gleich.
3. **Titel/Descriptions** schärfen (Kontakt, Mentra, Therapie Ost, Voice Agent, Dashboard,
   Lösungen), Bindestriche korrigieren.
4. **Strukturierte Daten**: Leistungsnamen an sichtbare Titel angleichen, doppelte Angebotsangaben
   bereinigen, falsches `isPartOf` bei Website-Projekten entfernen.
5. **`data-nosnippet`** für die dekorativen Grafiken (fiktive Website, Mini-Animationen).
6. **Über mich**: Lebenslauf-Text als `hidden="until-found"` auffindbar machen.
7. **Interne Verlinkung**: «Weitere Projekte» zeigt die jeweils nächsten drei Referenzen, damit
   jede Detailseite verlinkt wird.
8. **llms.txt / llms-full.txt** auf den aktuellen Stand bringen, echte Umlaute.
9. **lastmod / dateModified** der geänderten Seiten auf den 28.10.2026.

## C · Tempo

1. Kleineres CSS (A1).
2. Referenz-Hero-Bilder responsiv (`srcset` 1080/1440/2160, passender Preload).
3. Logo nicht mehr mit hoher Priorität vorladen (konkurriert mit dem Hero-Bild).
4. `.htaccess`: Weiterleitungen absolut (eine Weiterleitung weniger), kurze Cache-Dauer für
   `.txt`, `.xml`, `.webmanifest`.

## Bewusst nicht geändert

- Einblendanimationen über dem Falz (würden die Gestaltung sichtbar ändern).
- robots.txt-Politik für Trainingscrawler (Betreiberentscheid, siehe Bericht).
- Neue OG-Bilder 1200×630 (separater Gestaltungsschritt).
- Brotli beim Hoster (Serverkonfiguration ausserhalb des Projekts).
