export const REFERENCES_INITIAL_VISIBLE = 2;
export const REFERENCES_PER_PAGE = 4;

const referenceEntries = [
  {
    href: '/referenzen/mentra/',
    imgSrc: '/referenzen/mentra/mentra-video-wissenssystem-referenzbild.webp',
    imgAlt: 'Mentra KI-Wissenssystem als reduziertes App-Visual mit dunkler Oberfläche und KI-Farben',
    listImgCls: 'ref-main-card-img--purple',
    moreImgCls: 'case-more-card-img--purple',
    badge: { text: 'KI Lösung', cls: 'accent-purple' },
    linkCls: 'ref-main-link--ki',
    year: 'Jun 2026',
    sortDate: '2026-06-06',
    listTitle: 'Mentra Videowissenssystem',
    moreTitle: 'Mentra Videowissenssystem',
    sub: 'Lokale App mit KI, die Wissen aus Videos sichert und nutzbar macht',
    listDesc: 'Gute Videos schaut man einmal und vergisst sie wieder. Diese App läuft komplett lokal auf dem eigenen Rechner, sichert jedes Video als Wissen, macht es durchsuchbar, beantwortet Fragen im Chat und bereitet alles zum Lernen auf. So bleibt, was sonst verloren geht.',
    moreDesc: 'Macht Video-Wissen lokal nutzbar: KI-Auswertung, Suche, Chat, Reviews und Exporte.',
    ariaLabel: 'Mentra Video-Wissenssystem - Details ansehen',
  },
  {
    href: '/referenzen/thinktank/',
    imgSrc: '/referenzen/thinktank/thinktank-wissensdatenbank-kmu-referenzbild.webp',
    imgAlt: 'ThinkTank Wissensplattform für ein KMU als reduzierte App-Visual mit cyanfarbenen Modulen und dunkler Oberfläche',
    listImgCls: 'ref-main-card-img--cyan',
    moreImgCls: 'case-more-card-img--cyan',
    badge: { text: 'App', cls: 'accent-cyan' },
    linkCls: '',
    year: 'Mai 2026',
    sortDate: '2026-05-01',
    listTitle: 'ThinkTank Wissensplattform',
    moreTitle: 'ThinkTank Wissensplattform',
    sub: 'Interne Plattform, die Wissen ordnet, auffindbar macht und aktuell hält',
    listDesc: 'In jedem Betrieb steckt Wissen in Köpfen, Chats und Ordnern, bis jemand fehlt. Diese Plattform sammelt es an einem Ort, ordnet es in klare Themenwelten, macht es in Sekunden auffindbar und hält es durch Reviews aktuell. Eine Oberfläche, die im Alltag wirklich benutzt wird.',
    moreDesc: 'Bringt Struktur, Suche, Reviews und Verantwortlichkeiten in eine klar geführte Wissensplattform.',
    ariaLabel: 'ThinkTank Wissensplattform - Details ansehen',
  },
  {
    href: '/referenzen/ki-voice-agent/',
    imgSrc: '/referenzen/ki-voice-agent/ki-voice-agent-ahv-hilfsmittel-sprachassistent.svg',
    imgAlt: 'KI Voice Agent für IV-Stellen - AHV Hilfsmittel Sprachassistent von Nigredo',
    listImgCls: 'ref-main-card-img--purple',
    moreImgCls: 'case-more-card-img--purple',
    badge: { text: 'KI Lösung', cls: 'accent-purple' },
    linkCls: 'ref-main-link--ki',
    year: 'Feb 2026',
    sortDate: '2026-02-01',
    listTitle: 'KI Agent für IV-Stellen',
    moreTitle: 'KI Voice Agent für IV-Stellen',
    sub: 'Sprachassistent für Fragen rund um AHV Hilfsmittel',
    listDesc: 'Wer anruft, will eine Antwort und keine Warteschleife. Dieser Sprachassistent antwortet sofort, spricht vier Sprachen und kennt sich bei AHV Hilfsmitteln aus. Ein Prototyp, nah genug am Alltag der IV Stellen gebaut, um zu zeigen, wie Beratung ohne Wartezeit klingt.',
    moreDesc: 'Beantwortet Anfragen zu AHV-Hilfsmitteln sofort, mehrsprachig und ohne Warteschleife.',
    ariaLabel: 'KI Agent für IV-Stellen - Details ansehen',
  },
  {
    href: '/referenzen/dashboard-kantonsverwaltung/',
    imgSrc: '/referenzen/dashboard-kantonsverwaltung/dashboard-kantonsverwaltung-excel-kpi-browser.svg',
    imgAlt: 'Dashboard für Verwaltung - Excel KPI-Auswertung im Browser ohne Cloud',
    listImgCls: 'ref-main-card-img--cyan',
    moreImgCls: 'case-more-card-img--cyan',
    badge: { text: 'App', cls: 'accent-cyan' },
    linkCls: '',
    year: 'Jun 2025',
    sortDate: '2025-06-01',
    listTitle: 'Dashboard für Verwaltung',
    moreTitle: 'Dashboard für Verwaltung',
    sub: 'Auswertung aus Excel direkt im Browser, ganz ohne Cloud',
    listDesc: 'Sensible Personaldaten gehören nicht in die Cloud, sondern auf den eigenen Rechner. Genau da bleiben sie. Aus einer Excel Datei wird mit einem Klick ein klarer Bericht. Ohne Upload, ohne Ticket bei der IT, ohne Umweg durch drei Abteilungen.',
    moreDesc: 'Wertet Excel-Daten lokal aus, anonymisiert sensible Angaben und erstellt klare Berichte.',
    ariaLabel: 'Dashboard für Verwaltung - Details ansehen',
  },
  {
    href: '/referenzen/therapie-ost/',
    imgSrc: '/referenzen/therapie-ost/therapie-ost-website-illustration.svg',
    imgAlt: 'Website für Therapie Ost - dunkle illustrativ nachgebaute Startseite',
    listImgCls: 'ref-main-card-img--coral',
    moreImgCls: 'case-more-card-img--coral',
    badge: { text: 'Website', cls: 'accent-coral' },
    linkCls: '',
    year: 'Apr 2026',
    sortDate: '2026-04-01',
    listTitle: 'Website für Therapie Ost',
    moreTitle: 'Website für Therapie Ost',
    sub: 'Praxisauftritt mit Vertrauen, Klarheit und Terminbuchung online',
    listDesc: 'Eine Praxis muss nicht laut sein, um zu überzeugen. Dieser ruhige Auftritt für einen Standort in St. Gallen schafft Vertrauen mit echten Bildern, erklärt die Leistungen verständlich und führt in wenigen Schritten zur Terminbuchung. Leise, aber wirksam.',
    moreDesc: 'Bringt Vertrauen, Klarheit und direkte Online-Terminbuchung in einen ruhigen Praxisauftritt.',
    ariaLabel: 'Website für Therapie Ost - Details ansehen',
  },
] as const;

export type ReferenceEntry = (typeof referenceEntries)[number];

export const references = [...referenceEntries].sort((a, b) => (
  new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
));

export function getReferencePageCount() {
  return Math.max(1, Math.ceil(references.length / REFERENCES_PER_PAGE));
}

export function getReferencePage(pageNumber: number) {
  const start = (pageNumber - 1) * REFERENCES_PER_PAGE;
  return references.slice(start, start + REFERENCES_PER_PAGE);
}

export function getReferencePageHref(pageNumber: number) {
  return pageNumber <= 1 ? '/referenzen/' : `/referenzen/seite/${pageNumber}/`;
}
