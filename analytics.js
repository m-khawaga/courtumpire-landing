/* Basic opt-in: no Google code or requests until a saved, explicit acceptance.
 * See README for the required GA4 Enhanced Measurement account settings.
 */
(() => {
  'use strict';
  if (window.courtUmpireConsentLoaded) return;
  window.courtUmpireConsentLoaded = true;

  const ID = 'G-79B08QBGVE';
  const KEY = 'courtumpire.analytics.v1';
  const COOKIE = 'cu_consent';
  const TTL = 180 * 24 * 60 * 60 * 1000;
  const production = location.hostname === 'courtumpire.com' && location.protocol === 'https:';
  const paths = new Set(['/', '/index.html', '/contact.html', '/privacy.html', '/impressum.html']);
  const pageLocation = 'https://courtumpire.com' + (location.pathname === '/index.html' ? '/' : location.pathname);
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  let started = false;
  let accepted = false;
  let expiryTimer;
  let returnFocus;
  let fallback = new URL(location.href).searchParams.get('analytics') === 'off';
  window['ga-disable-' + ID] = true;

  function cookieValue() {
    try {
      return document.cookie.split('; ').find(value => value.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    } catch { return undefined; }
  }

  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (!value || value.version !== 1 || !['accepted', 'rejected'].includes(value.choice) ||
          !Number.isSafeInteger(value.savedAt) || !Number.isSafeInteger(value.expiresAt) ||
          value.savedAt > Date.now() || value.expiresAt - value.savedAt !== TTL || value.expiresAt <= Date.now()) return null;
      // Both stores must agree before a previous acceptance can start Google.
      if (value.choice === 'accepted' && cookieValue() !== 'accepted.' + value.savedAt) return null;
      return value;
    } catch { return null; }
  }

  function saveChoice(choice) {
    const savedAt = Date.now();
    const value = { version: 1, choice, savedAt, expiresAt: savedAt + TTL };
    let stored = false;
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
      stored = localStorage.getItem(KEY) === JSON.stringify(value);
    } catch { /* Never treat a failed write as consent. */ }
    try {
      document.cookie = COOKIE + '=' + choice + '.' + savedAt + '; Max-Age=' + TTL / 1000 +
        '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    } catch { /* The URL guard below also covers failed cookie writes. */ }
    return stored && cookieValue() === choice + '.' + savedAt;
  }

  function clearAnalyticsCookies() {
    try {
      for (const item of document.cookie.split('; ')) {
        const name = item.split('=')[0];
        if (!/^(cu_ga|_ga)(_|$)/.test(name)) continue;
        for (const domain of ['', '; Domain=courtumpire.com', '; Domain=.courtumpire.com']) {
          document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
        }
      }
    } catch { /* Tracking is disabled independently of cookie access. */ }
  }

  const panel = document.createElement('section');
  panel.className = 'consent-panel';
  panel.setAttribute('aria-labelledby', 'consent-title');
  panel.innerHTML = '<div class="container consent-inner"><div><h2 id="consent-title">Optional website analytics</h2>' +
    '<p>Allow Google Analytics to measure page visits and Google Play link clicks? The app’s local match data is separate. ' +
    'Your choice lasts 180 days. <a href="privacy.html#website-analytics">Privacy Policy</a></p>' +
    '<p class="consent-status" role="status"></p></div><div class="consent-actions">' +
    '<button type="button" class="consent-choice" data-choice="accepted">Accept analytics</button>' +
    '<button type="button" class="consent-choice" data-choice="rejected">Reject analytics</button>' +
    '<button type="button" class="consent-close" hidden>Close settings</button></div></div>';
  // In normal document flow: the banner never overlays content or keyboard focus.
  document.querySelector('.site-header').after(panel);
  const status = panel.querySelector('[role="status"]');
  const acceptButton = panel.querySelector('[data-choice="accepted"]');
  const closeButton = panel.querySelector('.consent-close');
  const settings = document.querySelector('[data-analytics-settings]');
  settings.hidden = false;

  function showChoices(focus = false) {
    panel.hidden = false;
    closeButton.hidden = !readChoice();
    if (focus) {
      returnFocus = document.activeElement;
      acceptButton.focus();
    }
  }

  function hideChoices() {
    const hadFocus = panel.contains(document.activeElement);
    panel.hidden = true;
    if (hadFocus) (returnFocus?.isConnected ? returnFocus : settings).focus({ preventScroll: true });
    returnFocus = null;
  }

  // If BOTH storage mechanisms fail on withdrawal, keep a rejection guard in
  // the reload URL and all internal links. A stale acceptance cannot restart GA.
  function guardRejection(enabled) {
    fallback = enabled;
    const url = new URL(location.href);
    if (enabled) url.searchParams.set('analytics', 'off');
    else url.searchParams.delete('analytics');
    history.replaceState(null, '', url);
    for (const link of document.querySelectorAll('a[href]')) {
      const target = new URL(link.href);
      if (target.origin !== location.origin) continue;
      if (enabled) target.searchParams.set('analytics', 'off');
      else target.searchParams.delete('analytics');
      link.href = target.href;
    }
  }

  function stopTracking() {
    accepted = false;
    window['ga-disable-' + ID] = true;
    clearTimeout(expiryTimer);
    // Disable before the consent update: no withdrawal/cookieless ping.
    if (started) window.gtag('consent', 'update', denied);
    clearAnalyticsCookies();
  }

  function reject() {
    const needsReload = started;
    stopTracking();
    guardRejection(!saveChoice('rejected'));
    hideChoices();
    if (needsReload) location.replace(location.href);
  }

  function startTracking(choice) {
    accepted = true;
    clearTimeout(expiryTimer);
    function scheduleExpiry() {
      const remaining = choice.expiresAt - Date.now();
      if (remaining > 0) {
        expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
        return;
      }
      stopTracking();
      showChoices();
      if (started) location.reload();
    }
    scheduleExpiry();
    // No Google script is even inserted on local or preview hosts.
    if (!accepted || !production || !paths.has(location.pathname) || started) return;
    started = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', denied);
    window.gtag('set', {
      ads_data_redaction: true, url_passthrough: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      send_page_view: false, page_location: pageLocation, page_referrer: ''
    });
    window.gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', ID, {
      send_page_view: false, page_location: pageLocation, page_referrer: '',
      page_title: document.title, allow_google_signals: false,
      allow_ad_personalization_signals: false, cookie_prefix: 'cu',
      cookie_domain: 'courtumpire.com', cookie_path: '/',
      cookie_expires: Math.floor((choice.expiresAt - Date.now()) / 1000), cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    window.gtag('event', 'page_view', { send_to: ID, page_location: pageLocation, page_referrer: '', page_title: document.title });
    const script = document.createElement('script');
    script.async = true;
    // Do not expose query strings in the HTTP referrer of the script request.
    script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.append(script);
  }

  settings.addEventListener('click', () => showChoices(true));
  closeButton.addEventListener('click', hideChoices);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !closeButton.hidden) hideChoices();
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-choice]');
    if (!button) return;
    if (button.dataset.choice === 'rejected') return reject();
    if (!saveChoice('accepted')) {
      stopTracking();
      guardRejection(true);
      status.textContent = 'Your choice could not be saved. Analytics stays off. You can continue using the site or reject analytics.';
      return;
    }
    guardRejection(false);
    status.textContent = '';
    hideChoices();
    const choice = readChoice();
    if (choice?.choice === 'accepted') {
      if (started && window['ga-disable-' + ID]) location.reload();
      else startTracking(choice);
    }
    else {
      stopTracking();
      showChoices(true);
    }
  });

  function recheckConsent() {
    if (!accepted) return;
    const choice = readChoice();
    if (!choice || choice.choice !== 'accepted') {
      stopTracking();
      // Unload Google's already loaded code before showing new choices.
      if (started) location.reload();
      else showChoices();
    }
  }
  window.addEventListener('storage', recheckConsent);
  window.addEventListener('pageshow', recheckConsent);
  window.addEventListener('focus', recheckConsent);
  document.addEventListener('visibilitychange', recheckConsent);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-play-placement]');
    if (!link) return;
    recheckConsent();
    const placement = link.dataset.playPlacement;
    if (!accepted || !started || !['header', 'hero', 'download_section'].includes(placement) ||
        link.href !== 'https://play.google.com/store/apps/details?id=com.mahmoud.courtvoice') return;
    window.gtag('event', 'google_play_click', {
      send_to: ID, placement, page_location: pageLocation, page_referrer: ''
    });
    // No preventDefault, callback, timeout or synthetic navigation.
  });

  if (fallback) guardRejection(!saveChoice('rejected'));
  const saved = readChoice();
  if (!fallback && saved?.choice === 'accepted') {
    panel.hidden = true;
    startTracking(saved);
  } else if (fallback || saved?.choice === 'rejected') {
    panel.hidden = true;
    clearAnalyticsCookies();
  } else {
    clearAnalyticsCookies();
    showChoices();
  }
})();
