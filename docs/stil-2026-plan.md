# Stil 2026: Unterseiten im Stil der neuen Startseite

Ziel: Referenzen, Referenz-Detailseiten, Lösungen, Über mich und Kontakt wirken wie die neue
Startseite: schlicht, luftig, hochwertig. Inhalte, Texte, SEO-Daten und URLs bleiben unverändert.

## 1. Gemeinsames Fundament

- **Stilschicht** `src/styles/stil-2026.css`, nach `global.css` geladen. Sie überschreibt gezielt die
  gemeinsamen Klassen, statt jede Seite einzeln umzubauen.
- **Raster**: Inhalt und Kopfzeile auf **1120 px** (`--container-width`, `--shell-width`), wie die
  Startseite. Lesetexte bleiben auf angenehmer Zeilenlänge begrenzt.
- **Seitenkopf**: Breadcrumb klein und leise, H1 im Startseiten-Format (zweite Zeile mit Verlauf),
  Lead mit maximal ~56 Zeichen pro Zeile, mehr Luft nach unten.
- **Abschnittsköpfe** (`home-head`), **Projektkarten** (`work-card`) und **Abschnittsabstände**
  (`home-section`) wandern aus der Startseite in die Stilschicht und werden überall genutzt.
- **Abschluss** (`.section-cta`): auf allen Seiten wie das Ende der Startseite: weiches Leuchten,
  grosse Überschrift, zweite Zeile im Verlauf, keine Box.
- **Karten**: ein Kartenstil (leicht transparente Fläche, feine Kante, 24 px Radius, Akzentkante beim
  Hover). Keine Nummerierungen, keine schweren Schatten, wenige Trennlinien.

## 2. Referenzen (Übersicht und Seite 2)

- Seitenkopf neu.
- Erstes Projekt als breite Karte, danach Zweierraster mit grossen Bildern, wie auf der Startseite.
  Kurzbeschreibung, Rolle, Projekt- und Website-Link bleiben erhalten.
- Seitennavigation als ruhige Pillen.

## 3. Referenz-Detailseiten (alle 9)

- Gemeinsame Klassen zentral umgestalten, Projektfarben bleiben je Seite.
- Hero: grosser Titel links, Bild rechts im Browserrahmen mit farbigem Leuchten der Projektfarbe.
- Kennzahlen als offene Zeile mit feinen Trennern statt Kästen.
- Ergebnis-Abschnitt: Startseiten-Abschnittskopf, Funktionen als ruhiges Zweierraster.
- «Weitere Projekte» mit den neuen Projektkarten.

## 4. Lösungen

- Seitenkopf neu.
- Die drei Leistungsfelder als grosse Karten mit denselben Mini-Animationen wie auf der Startseite.
  «Leistungsumfang» bleibt aufklappbar.
- Zusammenarbeit als Schrittliste im Stil von «Direkt mit mir» (ohne 01/02/03).

## 5. Über mich

- Seitenkopf neu.
- Grosses Porträt im Hochformat statt Kreis, Zitat und Text daneben.
- Kennzahlen als offene Zeile mit Verlaufszahlen.
- Grundsätze als drei offene Karten ohne Nummern.

## 6. Kontakt

- Seitenkopf neu, Formular rechts als dunkle Glasfläche wie das Ideenfeld der Startseite.
- Felder mit Verlaufsfokus, ruhigere Kanten.

## 7. Prüfung

- Jede Seite auf 1440 px und 375 px, kein seitliches Scrollen, keine Konsolenfehler.
- FAQ, Impressum und Datenschutz kurz gegenprüfen (geteilte Stilschicht).
- `astro build` in einen Wegwerfordner. Kein Deployment, kein Commit ohne Auftrag.
