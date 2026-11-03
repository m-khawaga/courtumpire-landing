// Opt-in public presentation only. No publishing, consent or tool-state ownership.
export function embeddedOptions(href) {
  const url = new URL(href);
  return url.searchParams.get('cu-app') === '1'
    ? {theme: url.searchParams.get('cu-theme') === 'light' ? 'light' : 'dark'} : null;
}
export function canonicalResource(href) {
  const url = new URL(href);
  for (const key of ['cu-app', 'cu-theme', 'cu-action', 'cu-data']) url.searchParams.delete(key);
  return url.href;
}
export function nativeScoringLink(href, base) {
  try { const url = new URL(href, base); const path = decodeURIComponent(url.pathname).replace(/\/$/, '').toLowerCase().replace(/\/index\.html$/, '');
    return url.origin === new URL(base).origin && (path === '/play-score/scoreboard' || path.startsWith('/play-score/scoreboard/'));
  } catch { return false; }
}
export function presentationLink(href, base, theme) {
  const url = new URL(href, base);
  if(url.origin !== new URL(base).origin || !['http:', 'https:'].includes(url.protocol)) return url.href;
  url.searchParams.set('cu-app', '1'); url.searchParams.set('cu-theme', theme);
  return url.href;
}

export function startEmbeddedPresentation(value) {
  if(typeof document==='undefined')return;
  if(window.courtUmpirePresentation){window.courtUmpirePresentation.setTheme(value);return;}
  let theme = value==='light'?'light':'dark';
  // One authoritative opt-in mode, also callable after a native WebView redirect/POST.
  const style=document.createElement('link');style.rel='stylesheet';style.href='/weekly/embedded.css';
  style.dataset.cuEmbeddedStyle='1';document.head.append(style);
  const root = document.documentElement;
  root.dataset.cuApp = '1'; root.dataset.cuTheme = theme;
  const apply = () => {
    for(const anchor of document.querySelectorAll('a[href]')) {
      if(anchor.getAttribute('href').startsWith('#') || anchor.hasAttribute('download')) continue;
      let target; try { target = new URL(anchor.href, location.href); } catch { continue; }
      // Hide only links to website live scoring; native interception is the authority.
      anchor.classList.toggle('cu-native-score-link', nativeScoringLink(target.href, location.href));
      if(target.origin === location.origin && ['http:', 'https:'].includes(target.protocol)) {
        anchor.href = presentationLink(target.href, location.href, theme);
      }
    }
  };
  window.courtUmpirePresentation = {setTheme(value) {
    theme = value === 'light' ? 'light' : 'dark'; root.dataset.cuTheme = theme;
    const presented=presentationLink(location.href, location.href, theme);
    if(presented!==location.href)history.replaceState(history.state, '', presented);
    apply();
  }};
  window.courtUmpirePresentation.setTheme(theme);
  // Print stays on the existing app navigation action. PNG bytes never go in a URL.
  window.print = () => {
    const url = new URL(location.href); url.searchParams.set('cu-action', 'print'); location.assign(url.href);
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || anchor.getAttribute('href').startsWith('#')) return;
    anchor.href = presentationLink(anchor.href, location.href, theme);
  }, true);
  const ready = () => {
    // Keep the actual web consent button and its listener in the original footer.
    const links = document.querySelector('.site-footer .footer-links');
    if (links) {
      for (const link of links.querySelectorAll('a[href]')) {
        const path = new URL(link.href, location.href).pathname.replace(/\/$/, '');
        if (path === '/site-map' || path === '/site-map/') link.hidden = true;
      }
      const legal = document.createElement('details');
      legal.className = 'cu-legal';
      const summary = document.createElement('summary');
      summary.textContent = 'Privacy & legal';
      links.before(legal);
      legal.append(summary, links);
    }
    if (location.pathname === '/practice-planner/') {
      const explanation = document.querySelector('.tool-explanation');
      if (explanation) {
        const details = document.createElement('details');
        details.className = 'cu-planner-help';
        const summary = document.createElement('summary');
        summary.textContent = 'How this works';
        explanation.before(details);
        details.append(summary, explanation);
      }
    }
    const brand = document.querySelector('.weekly-publication .eyebrow, .weekly-page > .weekly-masthead > .eyebrow');
    if (brand?.textContent.trim() === 'CourtUmpire Weekly' && !brand.querySelector('.cu-brand-umpire')) {
      const umpire = document.createElement('span');
      umpire.className = 'cu-brand-umpire';
      umpire.textContent = 'Umpire';
      brand.replaceChildren('Court', umpire, ' Weekly');
    }
    const article = document.querySelector('.weekly-article');
    const contents = article?.querySelector(':scope > .weekly-contents');
    if (contents && !article.querySelector('.weekly-app-contents')) {
      const details = document.createElement('details');
      details.className = 'weekly-app-contents';
      const summary = document.createElement('summary');
      summary.textContent = 'In this edition';
      contents.before(details);
      contents.classList.remove('weekly-contents');
      details.append(summary, contents);
    }
    apply();
    new MutationObserver(records => {
      if(records.some(record => record.addedNodes.length)) apply();
    }).observe(document.body, {childList:true, subtree:true});
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
}

if(typeof document!=='undefined' && embeddedOptions(location.href))startEmbeddedPresentation(embeddedOptions(location.href).theme);
