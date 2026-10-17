/* Run with Node.js and Playwright installed; see README. No external traffic.
 * Production-origin tests fulfill site requests from the local HTTP server and
 * substitute a recording stub for gtag.js. They do not prove GA4 collection.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'contact.html', 'privacy.html', 'impressum.html'];
const ID = 'G-H387MYJ9KJ';
const KEY = 'courtumpire.analytics.v1';
const ttl = 180 * 86400000;
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end();
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const stub = `window.__recordedGtag=[];
for(const item of window.dataLayer) window.__recordedGtag.push(Array.from(item));
const push=window.dataLayer.push.bind(window.dataLayer);
window.dataLayer.push=function(item){window.__recordedGtag.push(Array.from(item));return push(item)};
if(!window['ga-disable-${ID}']) {document.cookie='cu_ga=test; Path=/; Secure';document.cookie='cu_ga_H387MYJ9KJ=test; Domain=courtumpire.com; Path=/; Secure';}`;

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const local = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  let assertions = 0;
  function check(value, label) { assert.ok(value, label); assertions++; }
  async function fixture({ origin = 'https://courtumpire.com', init, blocked = false } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const requests = [];
    const errors = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin || url.origin === local) {
        const response = await fetch(local + url.pathname + url.search);
        return route.fulfill({ status: response.status, headers: { 'content-type': response.headers.get('content-type') || '' }, body: Buffer.from(await response.arrayBuffer()) });
      }
      requests.push(route.request().url());
      if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
        if (blocked) return route.abort();
        return route.fulfill({ contentType: 'application/javascript', body: stub });
      }
      if (url.hostname === 'play.google.com') return route.fulfill({ contentType: 'text/html', body: '<p>Intercepted Google Play navigation</p>' });
      // Block every other external request, including collection endpoints.
      return route.abort();
    });
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return { context, page, requests, errors, origin, async open(name = '') { await page.goto(origin + '/' + name); } };
  }
  async function commands(page) { return page.evaluate(() => Array.from(window.dataLayer || [], item => Array.from(item))); }
  async function scriptCount(page) { return page.locator('script[src*="googletagmanager"]').count(); }
  async function accept(page) { await page.getByRole('button', { name: 'Accept analytics', exact: true }).click(); }
  async function settings(page) { await page.getByRole('button', { name: 'Analytics settings', exact: true }).click(); }

  try {
    // All public pages, metadata, XML, assets, internal links and layout.
    const f = await fixture({ origin: local });
    for (const width of [360, 390, 768, 1440]) {
      await f.page.setViewportSize({ width, height: 900 });
      for (const name of pages) {
        await f.open(name);
        const result = await f.page.evaluate(async () => {
          const canon = document.querySelector('link[rel="canonical"]').href;
          const invalidLinks = [];
          for (const link of document.querySelectorAll('a[href]')) {
            const url = new URL(link.href);
            if (url.origin !== location.origin) continue;
            const response = await fetch(url.pathname);
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            if (!response.ok || (url.hash && !doc.getElementById(decodeURIComponent(url.hash.slice(1))))) invalidLinks.push(link.href);
          }
          // Exercise lazy image loads before checking their decode results.
          for (const img of document.images) { img.loading = 'eager'; await img.decode().catch(() => {}); }
          return {
            canon, canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
            og: document.querySelector('[property="og:url"]').content,
            ogTitle: document.querySelector('[property="og:title"]').content,
            twitterTitle: document.querySelector('[name="twitter:title"]').content,
            title: document.title, description: document.querySelector('[name="description"]').content,
            ogDescription: document.querySelector('[property="og:description"]').content,
            twitterDescription: document.querySelector('[name="twitter:description"]').content,
            socialImage: document.querySelector('[property="og:image"]').content,
            invalidLinks, overflow: document.documentElement.scrollWidth > innerWidth,
            images: Array.from(document.images, img => ({ ok: img.complete && img.naturalWidth > 0, width: img.getAttribute('width'), height: img.getAttribute('height'), alt: img.getAttribute('alt') })),
            h1: document.querySelectorAll('h1').length,
            analyticsScripts: document.querySelectorAll('script[src="analytics.js"]').length,
            skip: !!document.querySelector('.skip-link[href="#main-content"]'),
            settings: !!document.querySelector('[data-analytics-settings]'),
            reduced: getComputedStyle(document.documentElement).scrollBehavior
          };
        });
        check(!result.overflow, `${name} at ${width}: no overflow`);
        check(result.invalidLinks.length === 0, `${name}: links ${result.invalidLinks}`);
        const canonical = 'https://courtumpire.com/' + (name === 'index.html' ? '' : name);
        check(result.canonicalCount === 1 && result.canon === canonical && result.og === canonical, `${name}: canonical/OG URL`);
        check(result.ogTitle === result.title && result.twitterTitle === result.title, `${name}: social titles`);
        check(result.ogDescription === result.description && result.twitterDescription === result.description, `${name}: descriptions`);
        check(result.socialImage === 'https://courtumpire.com/assets/social-card.jpg', `${name}: real social artwork`);
        check(result.images.every(img => img.ok && img.width && img.height && img.alt), `${name}: image load/dimensions/alt`);
        check(result.h1 === 1 && result.analyticsScripts === 1 && result.skip && result.settings, `${name}: semantics/shared integration`);
        check(result.reduced === 'auto', `${name}: reduced motion`);
        if (process.env.SCREENSHOT_DIR && ['index.html', 'privacy.html'].includes(name) && [360, 1440].includes(width)) {
          fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
          await f.page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${name}-${width}.png`), fullPage: true });
        }
      }
    }
    await f.open();
    const xmlResult = await f.page.evaluate(async () => {
      const xml = new DOMParser().parseFromString(await (await fetch('/sitemap.xml')).text(), 'application/xml');
      return { error: !!xml.querySelector('parsererror'), namespace: xml.documentElement.namespaceURI, urls: Array.from(xml.querySelectorAll('loc'), node => node.textContent) };
    });
    check(!xmlResult.error && xmlResult.namespace === 'http://www.sitemaps.org/schemas/sitemap/0.9', 'Sitemap parses with correct namespace');
    assert.deepEqual(xmlResult.urls, pages.map(name => 'https://courtumpire.com/' + (name === 'index.html' ? '' : name)));
    for (const url of xmlResult.urls) check(fs.existsSync(path.join(root, new URL(url).pathname === '/' ? 'index.html' : new URL(url).pathname.slice(1))), 'Sitemap maps to a published file');
    check(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes('Sitemap: https://courtumpire.com/sitemap.xml'), 'robots sitemap');
    for (const name of ['index.html', 'contact.html']) check(!/beta|pre-release|groups\.google/i.test(fs.readFileSync(path.join(root, name), 'utf8')), 'Beta invitation removed: ' + name);
    await f.page.keyboard.press('Tab');
    check(await f.page.locator('.skip-link').evaluate(el => el === document.activeElement), 'Skip link first in keyboard order');
    await f.page.keyboard.press('Enter');
    check(await f.page.locator('main').evaluate(el => el === document.activeElement), 'Skip link focuses main');
    await f.page.locator('summary').first().focus();
    await f.page.keyboard.press('Enter');
    check(await f.page.locator('details').first().evaluate(el => el.open), 'Native FAQ keyboard toggle');
    await accept(f.page);
    check(f.requests.length === 0 && await scriptCount(f.page) === 0, 'Local acceptance cannot load Google');
    check(f.errors.length === 0, 'No JS errors across layout/link checks');
    await f.context.close();

    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 900 } });
    await noJs.route('**/*', route => new URL(route.request().url()).origin === local ? route.continue() : route.abort());
    const plain = await noJs.newPage();
    await plain.goto(local);
    check(await plain.locator('details').count() === 5, 'All five FAQ questions rendered without JavaScript');
    for (const details of await plain.locator('details').all()) {
      await details.locator('summary').click();
      check(await details.locator('p').isVisible(), 'FAQ answer available without JavaScript');
    }
    check(await plain.locator('[data-play-placement="hero"]').isVisible(), 'Main CTA remains usable without JavaScript');
    await noJs.close();

    function luminance(hex) {
      const values = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
    }
    for (const [fg, bg] of [['9caabd', '0a1c33'], ['c0cbd8', '07172b'], ['f7f9fc', '07172b'], ['dfff00', '0c223d'], ['08111d', 'dfff00']]) {
      const values = [luminance(fg), luminance(bg)].sort((a,b) => b-a);
      check((values[0] + .05) / (values[1] + .05) >= 4.5, `Text palette contrast #${fg} on #${bg}`);
    }

    // Fresh visit/rejection across navigation and reload, keyboard/focus.
    const r = await fixture();
    await r.open();
    check(r.requests.length === 0 && await scriptCount(r.page) === 0, 'Fresh visit has no external Google requests');
    check(await r.page.evaluate(id => window['ga-disable-' + id] === true, ID), 'Correct stream disabled before consent');
    check((await r.context.cookies()).every(c => !/^(cu_ga|_ga)/.test(c.name)), 'Fresh visit has no GA cookies');
    await r.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await r.open('contact.html'); await r.page.reload();
    check(r.requests.length === 0 && await r.page.locator('.consent-panel').isHidden(), 'Saved rejection survives navigation/reload without Google');
    await settings(r.page);
    check(await r.page.getByRole('button', { name: 'Accept analytics', exact: true }).evaluate(el => el === document.activeElement), 'Reopen focuses choices');
    await r.page.keyboard.press('Tab');
    check(await r.page.getByRole('button', { name: 'Reject analytics', exact: true }).evaluate(el => el === document.activeElement), 'Reject equally keyboard accessible');
    await r.page.keyboard.press('Escape');
    check(await r.page.getByRole('button', { name: 'Analytics settings', exact: true }).evaluate(el => el === document.activeElement), 'Close restores footer focus');
    check(r.errors.length === 0, 'Rejection/focus no JS errors');
    await r.context.close();

    // Production-origin interception exercises the actual, unchanged host guard.
    const a = await fixture();
    await a.open('?email=private@example.com&utm_source=secret#private');
    await a.page.locator('[data-play-placement="hero"]').click();
    await a.page.waitForTimeout(50);
    check((await commands(a.page)).length === 0, 'Pre-consent Play click is not queued');
    await accept(a.page);
    await a.page.waitForFunction(() => window.__recordedGtag);
    let calls = await commands(a.page);
    check(await scriptCount(a.page) === 1 && a.requests.filter(url => url.includes('/gtag/js')).length === 1, 'Exactly one script after acceptance');
    check(await a.page.locator('script[src*="googletagmanager"]').getAttribute('src') === 'https://www.googletagmanager.com/gtag/js?id=' + ID, 'Single Google script uses the correct stream');
    check(await a.page.evaluate(id => window['ga-disable-' + id] === false, ID), 'Correct stream enabled only after consent');
    check(calls.filter(c => c[0] === 'config' && c[1] === ID).length === 1, 'Correct measurement ID configured once');
    check(calls.filter(c => c[0] === 'event' && c[1] === 'page_view').length === 1, 'Exactly one manual page_view');
    check(calls.findIndex(c => c[0] === 'consent' && c[1] === 'default') < calls.findIndex(c => c[0] === 'config'), 'Consent defaults precede config');
    check(calls.find(c => c[0] === 'consent' && c[1] === 'update')[2].analytics_storage === 'granted', 'Analytics granted after acceptance');
    check(calls.filter(c => c[0] === 'consent').every(c => ['ad_storage', 'ad_user_data', 'ad_personalization'].every(key => c[2][key] === 'denied')), 'Advertising always denied');
    check(!JSON.stringify(calls).includes('private') && !JSON.stringify(calls).includes('secret'), 'No query, hash or email in command data');
    check(calls.find(c => c[0] === 'config')[2].page_location === 'https://courtumpire.com/' && calls.find(c => c[0] === 'config')[2].page_referrer === '', 'Page location canonical; referrer omitted');
    await settings(a.page); await accept(a.page);
    check((await commands(a.page)).filter(c => c[0] === 'event' && c[1] === 'page_view').length === 1, 'Repeated acceptance does not duplicate page_view');
    for (const placement of ['header', 'hero', 'download_section']) {
      const [popup] = await Promise.all([a.context.waitForEvent('page'), a.page.locator(`[data-play-placement="${placement}"]`).click()]);
      await popup.waitForURL(/play\.google\.com/).catch(() => {});
      check(a.requests.some(url => url === 'https://play.google.com/store/apps/details?id=com.mahmoud.courtvoice'), 'Play navigation attempted normally');
      await popup.close();
    }
    calls = await commands(a.page);
    assert.deepEqual(calls.filter(c => c[0] === 'event' && c[1] === 'google_play_click').map(c => c[2].placement), ['header', 'hero', 'download_section']);
    check((await a.context.cookies()).some(c => c.name === 'cu_ga'), 'Stub simulated integration cookies');
    check((await a.context.cookies()).some(c => c.name === 'cu_ga_' + ID.slice(2)), 'Stub simulated cookie suffix matches the correct stream');
    for (const name of pages.slice(1)) {
      await a.open(name); await a.page.waitForFunction(() => window.__recordedGtag);
      check((await commands(a.page)).filter(c => c[0] === 'event' && c[1] === 'page_view').length === 1, name + ': saved acceptance emits one page_view');
    }
    const scriptsBefore = a.requests.filter(url => url.includes('/gtag/js')).length;
    await settings(a.page);
    await a.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await a.page.waitForLoadState('load');
    await a.page.reload();
    check(await scriptCount(a.page) === 0 && a.requests.filter(url => url.includes('/gtag/js')).length === scriptsBefore, 'Withdrawal/reload never restarts Google');
    check((await a.context.cookies()).every(c => !/^(cu_ga|_ga)/.test(c.name)), 'Withdrawal removes host and domain GA cookies');
    check(a.errors.length === 0, 'Acceptance/click/withdrawal no JS errors');
    await a.context.close();

    for (const seed of ['invalid', 'expired', 'future', 'wrong-version', 'missing-cookie', 'unavailable', 'unavailable-cookie']) {
      const u = await fixture({ init: `(${(({ seed, KEY, ttl }) => {
        if (seed === 'unavailable') { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); return; }
        if (seed === 'unavailable-cookie') Object.defineProperty(document, 'cookie', { get() { throw new Error('cookie access blocked'); }, set() { throw new Error('cookie writes blocked'); } });
        const savedAt = seed === 'expired' ? Date.now() - ttl - 1000 : seed === 'future' ? Date.now() + 100000 : Date.now();
        localStorage.setItem(KEY, seed === 'invalid' ? '{invalid' : JSON.stringify({ version: seed === 'wrong-version' ? 2 : 1, choice: 'accepted', savedAt, expiresAt: savedAt + ttl }));
        if (!['missing-cookie', 'unavailable-cookie'].includes(seed)) document.cookie = 'cu_consent=accepted.' + savedAt + '; Path=/; Secure';
      }).toString()})(${JSON.stringify({ seed, KEY, ttl })})` });
      await u.open();
      check(u.requests.length === 0 && await u.page.locator('.consent-panel').isVisible(), seed + ': fail closed with usable controls');
      if (['unavailable', 'unavailable-cookie'].includes(seed)) {
        await accept(u.page);
        check(u.requests.length === 0 && await u.page.getByRole('status').textContent() !== '', 'Unavailable storage never enables Google');
      }
      check(u.errors.length === 0, seed + ': no JS errors');
      await u.context.close();
    }

    // All writes fail after acceptance, but reads can later recover stale data.
    const w = await fixture();
    await w.open(); await accept(w.page);
    await w.page.waitForFunction(() => window.__recordedGtag);
    await w.context.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new Error('write blocked'); };
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      Object.defineProperty(document, 'cookie', { get() { return descriptor.get.call(document); }, set() {} });
    });
    await w.page.evaluate(() => {
      Storage.prototype.setItem = function () { throw new Error('write blocked'); };
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      Object.defineProperty(document, 'cookie', { get() { return descriptor.get.call(document); }, set() {} });
    });
    await settings(w.page);
    await w.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await w.page.waitForURL(/analytics=off/);
    await w.page.waitForLoadState('load');
    check(await scriptCount(w.page) === 0, 'Failed withdrawal writes: URL guard stops stale consent');
    await w.page.locator('nav a[href*="contact.html"]').click();
    check(w.page.url().includes('analytics=off') && await scriptCount(w.page) === 0, 'Rejection guard carried to another page');
    check(w.errors.length === 0, 'Withdrawal storage failure no JS errors');
    await w.context.close();

    const b = await fixture({ blocked: true });
    await b.open(); await accept(b.page); await settings(b.page);
    check(await b.page.getByRole('button', { name: 'Reject analytics', exact: true }).isVisible(), 'Blocked script leaves controls usable');
    await b.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await b.page.waitForLoadState('load');
    check(b.errors.length === 0, 'Blocked GA script does not break website');
    await b.context.close();
    console.log(`PASS: ${assertions} assertions; 16 page/viewport renders; all external requests intercepted. GA behavior uses a recording stub, not live collection.`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
