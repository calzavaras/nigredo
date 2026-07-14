export const REFERENCES_PER_PAGE = 4;

const referenceEntries = [
  {
    href: '/referenzen/mentra/',
    imgSrc: '/referenzen/mentra/mentra-video-wissenssystem-referenzbild.webp',
    imgAlt: 'Mentra KI-Wissenssystem als reduziertes App-Visual mit dunkler Oberfläche und KI-Farben',
    listImgCls: 'ref-main-card-img--purple',
    moreImgCls: 'case-more-card-img--purple',
    badge: { text: 'KI-Lösung', cls: 'accent-purple' },
    linkCls: 'ref-main-link--ki',
    year: 'Jun 2026',
    sortDate: '2026-06-06',
    listTitle: 'Mentra Video-Wissenssystem',
    moreTitle: 'Mentra Video-Wissenssystem',
    sub: 'Lokale App mit KI, die Wissen aus Videos sichert und nutzbar macht',
    listDesc: 'Mentra verwandelt Videos in strukturiertes, durchsuchbares Wissen. Die lokale App verbindet KI-Auswertung, Chat mit Quellen, Lernkarten und Exporte, ohne sensible Inhalte aus der eigenen Umgebung zu geben.',
    moreDesc: 'Macht Video-Wissen lokal nutzbar: KI-Auswertung, Suche, Chat, Reviews und Exporte.',
    ariaLabel: 'Details zum Mentra Video-Wissenssystem ansehen',
  },
  {
    href: '/referenzen/thinktank/',
    imgSrc: '/referenzen/thinktank/thinktank-wissensdatenbank-kmu-referenzbild.webp',
    imgAlt: 'ThinkTank Wissensplattform für ein KMU als reduziertes App-Visual mit cyanfarbenen Modulen und dunkler Oberfläche',
    listImgCls: 'ref-main-card-img--cyan',
    moreImgCls: 'case-more-card-img--cyan',
    badge: { text: 'App', cls: 'accent-cyan' },
    linkCls: '',
    year: 'Mai 2026',
    sortDate: '2026-05-01',
    listTitle: 'ThinkTank Wissensplattform',
    moreTitle: 'ThinkTank Wissensplattform',
    sub: 'Interne Plattform, die Wissen ordnet, auffindbar macht und aktuell hält',
    listDesc: 'ThinkTank bündelt internes Wissen in einer klar geführten Plattform. Themenwelten, Suche, Verantwortlichkeiten und Reviews sorgen dafür, dass Informationen auffindbar, aktuell und im Arbeitsalltag nutzbar bleiben.',
    moreDesc: 'Bringt Struktur, Suche, Reviews und Verantwortlichkeiten in eine klar geführte Wissensplattform.',
    ariaLabel: 'Details zur ThinkTank Wissensplattform ansehen',
  },
  {
    href: '/referenzen/ki-voice-agent/',
    imgSrc: '/referenzen/ki-voice-agent/ki-voice-agent-ahv-hilfsmittel-sprachassistent.svg',
    imgAlt: 'KI Voice Agent für IV-Stellen als Sprachassistent für Fragen zu AHV-Hilfsmitteln',
    listImgCls: 'ref-main-card-img--purple',
    moreImgCls: 'case-more-card-img--purple',
    badge: { text: 'KI-Lösung', cls: 'accent-purple' },
    linkCls: 'ref-main-link--ki',
    year: 'Feb 2026',
    sortDate: '2026-02-01',
    listTitle: 'KI-Agent für IV-Stellen',
    moreTitle: 'KI Voice Agent für IV-Stellen',
    sub: 'Sprachassistent für Fragen rund um AHV-Hilfsmittel',
    listDesc: 'Der funktionsfähige Sprachassistent beantwortet Fragen zu AHV-Hilfsmitteln in vier Sprachen und in Echtzeit. Der Prototyp zeigt, wie fachlich fundierte Auskunft ohne Warteschleife funktionieren kann.',
    moreDesc: 'Beantwortet Anfragen zu AHV-Hilfsmitteln sofort, mehrsprachig und ohne Warteschleife.',
    ariaLabel: 'Details zum KI-Agenten für IV-Stellen ansehen',
  },
  {
    href: '/referenzen/dashboard-kantonsverwaltung/',
    imgSrc: '/referenzen/dashboard-kantonsverwaltung/dashboard-kantonsverwaltung-excel-kpi-browser.svg',
    imgAlt: 'Dashboard für eine Verwaltung mit lokaler Excel-KPI-Auswertung im Browser',
    listImgCls: 'ref-main-card-img--cyan',
    moreImgCls: 'case-more-card-img--cyan',
    badge: { text: 'App', cls: 'accent-cyan' },
    linkCls: '',
    year: 'Jun 2025',
    sortDate: '2025-06-01',
    listTitle: 'Dashboard für Verwaltung',
    moreTitle: 'Dashboard für Verwaltung',
    sub: 'Auswertung aus Excel direkt im Browser, ganz ohne Cloud',
    listDesc: 'Das browserbasierte Dashboard verarbeitet Excel-Daten vollständig lokal. Es anonymisiert sensible Angaben, verdichtet Kennzahlen zu klaren Ansichten und erstellt Berichte, ohne Upload, Server oder Cloud.',
    moreDesc: 'Wertet Excel-Daten lokal aus, anonymisiert sensible Angaben und erstellt klare Berichte.',
    ariaLabel: 'Details zum Dashboard für eine Verwaltung ansehen',
  },
  {
    href: '/referenzen/therapie-ost/',
    imgSrc: '/referenzen/therapie-ost/therapie-ost-website-illustration.svg',
    imgAlt: 'Website für Therapie Ost mit dunkel illustrierter Startseite',
    listImgCls: 'ref-main-card-img--coral',
    moreImgCls: 'case-more-card-img--coral',
    badge: { text: 'Website', cls: 'accent-coral' },
    linkCls: '',
    year: 'Apr 2026',
    sortDate: '2026-04-01',
    listTitle: 'Website für Therapie Ost',
    moreTitle: 'Website für Therapie Ost',
    sub: 'Praxisauftritt mit Vertrauen, Klarheit und Terminbuchung online',
    listDesc: 'Der ruhige Praxisauftritt verbindet echte Bilder mit einer verständlichen Leistungsstruktur. Besucherinnen und Besucher finden schnell Orientierung und gelangen ohne Umwege zur Online-Terminbuchung.',
    moreDesc: 'Bringt Vertrauen, Klarheit und direkte Online-Terminbuchung in einen ruhigen Praxisauftritt.',
    ariaLabel: 'Details zur Website für Therapie Ost ansehen',
  },
  {
    href: '/referenzen/plan-h/',
    imgSrc: '/referenzen/plan-h/plan-h-hypnosetherapie-website-illustration.svg',
    imgAlt: 'Website für Plan H Hypnosetherapie mit korallfarbenem Akzent und türkisfarbener Hero-Grafik',
    listImgCls: 'ref-main-card-img--coral',
    moreImgCls: 'case-more-card-img--coral',
    badge: { text: 'Website', cls: 'accent-coral' },
    linkCls: '',
    year: 'Jun 2026',
    sortDate: '2026-06-30',
    listTitle: 'Website für Plan H',
    moreTitle: 'Website für Plan H',
    sub: 'Praxiswebsite mit Local SEO, WhatsApp-Kontakt und sortierbaren Stimmen',
    listDesc: 'Plan H verbindet verständliche Hypnosetherapie-Inhalte mit Local SEO, sauber strukturierten Daten und direktem WhatsApp-Kontakt. Sortierbare Stimmen machen Erfahrungen gezielt auffindbar und stärken das Vertrauen.',
    moreDesc: 'Verbindet ruhige Positionierung mit Local SEO, WhatsApp-Kontakt und strukturierten Vertrauenselementen.',
    ariaLabel: 'Details zur Website für Plan H Hypnosetherapie ansehen',
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
