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


## D · Abschliessender Feinschliff (Version 1.18.1)

Drei Fachprüfungen für Bedienbarkeit/Layout, JavaScript/PHP sowie SEO/Apache;
anschliessend gegenseitige Durchsicht und gemeinsame Abschlussprüfung.

- **Layout und Bedienbarkeit:** zurückhaltend höhere Kontraste für leise Texte und
  Platzhalter, sichtbarer Tastaturfokus und ein scrollbar begrenztes mobiles Menü.
  Die bestehende Gestaltung bleibt erhalten. Das Menü wurde zusätzlich bei 375 × 320
  Pixeln auf vollständige Erreichbarkeit aller Punkte geprüft.
- **Galerie:** Fokus bleibt im geöffneten Dialog, Escape schliesst ihn und gibt den
  Fokus zurück. Scrollsperre, schnelle Bildwechsel und erneutes Öffnen sind abgesichert.
- **Kontakt:** explizites POST-Ziel statt möglicher GET-Übertragung bei Skriptfehlern,
  E-Mail-Alternative ohne JavaScript, Schutz gegen doppelte Übermittlung und ungültige
  Array-Felder in PHP. Die Erfolgsmeldung bleibt bis zur bewussten nächsten Aktion sichtbar.
- **Weitere Fehlerfälle:** defekte FAQ-URL-Fragmente brechen die Initialisierung nicht
  mehr ab; eine leere neue Idee übernimmt keinen alten Entwurf aus dem Sitzungsspeicher.
- **Apache:** stabile Dateinamen werden kurz gecacht; unveränderliche Jahres-Caches
  gelten nur für versionierte Skripte und Astro-Assets mit Inhalts-Hash. Index-Dateien
  werden auch hinter einem HTTPS-Proxy auf die korrekte HTTPS-Adresse umgeleitet.
- **CSP:** vollständige Erfassung von Inline-Skripten auch bei `<` im JavaScript,
  deterministische Hash-Reihenfolge und zusätzliche Build-Prüfung aller Freigaben sowie
  der Übereinstimmung von Quell- und Deploy-`.htaccess`.
- **Projektpflege:** Build-Aufruf ohne unnötiges `npx`, Versionsabgleich in Paket und
  Lockdatei sowie korrigierte Dokumentation für Astro 7 und die Build-Reihenfolge.
  Keine neuen Abhängigkeiten und keine pauschalen Aktualisierungen der Inhaltsdaten.

### Prüfung und Übergabe

- Alle 32 Seiten bei 320 Pixeln auf horizontale Überläufe geprüft; ergänzende
  Ansichten bei 375, 768 und 1440 Pixeln kontrolliert.
- Alle 1’843 lokalen Link-, Bild-, Skript- und Stylesheet-Verweise sowie Ankerziele
  und doppelte IDs im generierten HTML geprüft.
- JavaScript-Syntax und gezielte Funktionstests der Galerie/FAQ-Fehlerfälle geprüft.
- Apache-Konfiguration: Syntaxprüfung und 15 reale lokale HTTP-Prüfungen auf
  Weiterleitungen und Header bestanden. SEO-/Sitemap-/CSP-Build-Validierung ohne Warnungen.
- Lokal steht kein PHP-Interpreter bereit. Der PHP-Code ist statisch geprüft;
  tatsächlicher Mailversand und die konkrete Hosting-Konfiguration müssen nach dem
  Upload am Hoster kontrolliert werden. Die Astro-Vorschau führt PHP nicht aus.

Für FTP den **gesamten Inhalt von `public/` einschliesslich der versteckten `.htaccess`**
in das bestehende Web-Verzeichnis hochladen. Alte Astro-Assets erst entfernen, wenn
keine noch gecachten HTML-Seiten mehr darauf verweisen. `src/`, `node_modules/`, `.git/`
und persönliche Konfigurationsdateien gehören nicht auf den Webserver.

`robots.txt`, die Bild-Sitemap und die LLM-Dateien sind im Build enthalten.
Ein IndexNow-Aufruf vor dem Upload wäre verfrüht und wird deshalb nicht ausgeführt.
