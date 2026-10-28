// Ausschliesslich lokale Auswahl; kein Consent-Dienst und keine Übertragung.
const STORAGE_KEY = 'nigredo-consent';
const CONSENT_VERSION = 1;
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function initCookieConsent() {
  const banner = document.getElementById('cookie-banner');
  const dialog = document.getElementById('cookie-dialog');
  const analytics = document.getElementById('cookie-analytics');
  const feedback = document.getElementById('cookie-feedback');
  if (!banner || !dialog || !analytics || !feedback) return;

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value?.version === CONSENT_VERSION && typeof value.analytics === 'boolean'
        && Number.isFinite(value.savedAt) && value.savedAt <= Date.now()
        && Date.now() - value.savedAt < MAX_AGE) return value;
    } catch { /* Gesperrter Speicher oder ungültige Daten: keine Einwilligung. */ }
    return null;
  }

  let consent = readConsent();
  let tracker = null;
  let feedbackTimer;
  let expiryTimer;
  let opener;
  const allowed = () => consent?.analytics === true && Date.now() - consent.savedAt < MAX_AGE;

  // Zusätzliche Sendesperre, auch bei Widerruf während des Ladens des Trackers.
  // Umamis dokumentierter before-send-Hook wird vor jedem Analyseereignis geprüft.
  window.nigredoBeforeSend = (_type, payload) => allowed() ? payload : false;

  function trackPageview() {
    if (allowed()) window.umami?.track();
  }

  function loadAnalytics() {
    if (!allowed()) return;
    if (window.umami) { trackPageview(); return; }
    if (tracker) return;
    const src = document.querySelector('meta[name="umami-src"]')?.content;
    const websiteId = document.querySelector('meta[name="umami-website-id"]')?.content;
    if (!src || !websiteId) return;
    tracker = document.createElement('script');
    tracker.src = src;
    tracker.defer = true;
    tracker.dataset.websiteId = websiteId;
    // Keine automatischen Listener, Sitzungsaufzeichnung oder Hintergrundereignisse.
    tracker.dataset.autoTrack = 'false';
    tracker.dataset.beforeSend = 'nigredoBeforeSend';
    tracker.dataset.excludeSearch = 'true';
    tracker.dataset.excludeHash = 'true';
    tracker.addEventListener('load', trackPageview, { once: true });
    tracker.addEventListener('error', () => { tracker.remove(); tracker = null; }, { once: true });
    document.head.appendChild(tracker);
  }

  function applyConsent() {
    banner.hidden = consent !== null;
    analytics.checked = allowed();
    clearTimeout(expiryTimer);
    if (consent) {
      // Kurze Intervalle vermeiden die maximale setTimeout-Dauer von ca. 25 Tagen.
      expiryTimer = setTimeout(refreshConsent, Math.min(MAX_AGE - (Date.now() - consent.savedAt) + 10, 60 * 60 * 1000));
    }
  }

  function refreshConsent() {
    const wasAllowed = allowed();
    consent = readConsent();
    applyConsent();
    if (!wasAllowed && allowed()) loadAnalytics();
  }

  function saveConsent(allowAnalytics) {
    const wasAllowed = allowed();
    consent = { version: CONSENT_VERSION, analytics: allowAnalytics, savedAt: Date.now() };
    let persisted = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); }
    catch { persisted = false; }
    applyConsent();
    if (dialog.open) dialog.close();
    if (!wasAllowed && allowed()) loadAnalytics();
    feedback.textContent = persisted
      ? (allowAnalytics ? 'Auswahl gespeichert. Die optionale Analyse ist aktiv.' : 'Auswahl gespeichert. Die optionale Analyse ist aus.')
      : 'Auswahl für diese Seite übernommen. Dein Browser verhindert das dauerhafte Speichern.';
    feedback.hidden = false;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 6000);
    // Der zuvor fokussierte Banner-Button ist nach dem Speichern ausgeblendet.
    if (banner.contains(document.activeElement)) document.querySelector('.cookie-settings-link')?.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-cookie-settings]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      analytics.checked = allowed();
      dialog.showModal();
    });
  });
  document.querySelectorAll('[data-cookie-reject]').forEach(button => button.addEventListener('click', () => saveConsent(false)));
  document.querySelectorAll('[data-cookie-accept]').forEach(button => button.addEventListener('click', () => saveConsent(true)));
  document.querySelector('[data-cookie-save]')?.addEventListener('click', () => saveConsent(analytics.checked));
  document.querySelector('[data-cookie-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    const target = opener?.closest('[hidden]') ? document.querySelector('.cookie-settings-link') : opener;
    target?.focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) refreshConsent();
  });
  window.addEventListener('pageshow', refreshConsent);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshConsent();
  });
  applyConsent();
  loadAnalytics();
}
