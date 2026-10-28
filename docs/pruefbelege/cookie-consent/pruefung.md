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

## Redaktionelle Nachprüfung am 28. Oktober 2026

Der Banner beschreibt nun die Verbesserung von Inhalten und Bedienung als Nutzen der optionalen Nutzungsanalyse. Anbieter, Analysezweck, Zustimmung und Änderungsmöglichkeit bleiben erkennbar. Der Dialog erläutert weiterhin Seitenaufrufe, technische Nutzungsdaten und die Verbindung zum externen Anbieter. Gestaltung und Consent-Steuerung wurden nicht verändert. Versionsentscheidung: kein weiterer Bump für diese reine Textanpassung; Version 1.19.0 bleibt bestehen.

Zwei voneinander unabhängige Agenten haben den Stand lesend geprüft: einer mit Schwerpunkt Transparenz und Schweizer EDÖB-Hinweise, einer mit Schwerpunkt UX, Textkonsistenz und technische Einwilligungssperre. Beide haben die Änderung ohne blockierende Befunde freigegeben. Die Reviews sind keine Rechtsgarantie; Anbietervereinbarungen und Auslandtransfergrundlagen waren nicht Gegenstand der Prüfung.

Erneute Browserprüfung nach der Textänderung: Erstbesuch ohne externe Requests, standardmässig ausgeschaltete Analyse, Speichern ohne Analyse, erhaltene Auswahl nach Neuladen, Öffnen und Schliessen der Einstellungen sowie Darstellung bei 320, 390, 768 und 1440 Pixeln erfolgreich. Keine JavaScript-Laufzeitfehler. Die Abbildungen wurden mit dem neuen Text aktualisiert. Die oben dokumentierte Prüfung mit dem echten Umami-Skript gilt für die unveränderte technische Steuerung.

Referenzen: [EDÖB-Merkblatt vom 31. März 2026](https://www.edoeb.admin.ch/dam/de/sd-web/ByXs53ExpIEy/20260327%20Merkblatt%20Cookies_DE.pdf) und [EDÖB-Leitfaden vom 6. Oktober 2025](https://www.edoeb.admin.ch/dam/de/sd-web/brLL9rM3ny9d/Leitfaden%20des%20ED%C3%96B%20betreffend%20Datenbearbeitungen%20mittels%20Cookies%20und%20%C3%A4hnlichen%20Technologien%20V.%201.1%20vom%2006.10.2025_DE.pdf).
