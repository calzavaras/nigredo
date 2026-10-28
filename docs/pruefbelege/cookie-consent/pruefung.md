# Cookie-Consent-Prüfung

Stand: 28. Oktober 2026, Version 1.19.0.

Produktionsbuild: 32 Seiten, Site-Validierung ohne Warnungen. Browserprüfung mit Chrome und dem am Prüftag geladenen echten Umami-Cloud-Skript. Externe Requests wurden abgefangen; keine Testdaten an Umami gesendet.

- Erstbesuch: kein externer Request, keine DNS-/Preconnect-Hinweise.
- Ablehnen bleibt nach Neuladen erhalten; weiterhin keine externen Requests.
- Auswahl speichern mit Analyse: echtes Umami-Skript sendet genau einen Seitenaufruf (im Test abgefangen).
- Zustimmung bleibt nach Neuladen erhalten; genau ein Seitenaufruf pro Laden.
- Widerruf: auch ein direkter Aufruf des echten Umami-Trackers erzeugt keinen weiteren Request.
- Offene Tabs übernehmen Zustimmung und Widerruf.
- Abgelaufene Einwilligung: erneute Nachfrage, keine Analyse.
- Ungültige Speicherdaten bleiben ohne Einwilligung.
- 320 / 390 / 768 / 1440 px: kein horizontaler Überlauf; Dialog per Escape schliessbar.
- Widerruf während verzögertem Skript-Download: anschliessend kein Analyseereignis.
- Gesperrter Speicher: Ablehnen funktioniert; Hinweis zur fehlenden dauerhaften Speicherung.
- Ohne JavaScript: keine externen Requests und keine funktionslosen Banner-Schaltflächen.

Keine JavaScript-Laufzeitfehler in den geprüften Abläufen. Die Apache-Header werden lokal von Astro Preview nicht ausgeliefert; ihre Konfiguration wurde durch validate:site geprüft.
