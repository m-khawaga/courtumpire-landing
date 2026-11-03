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
  // Existing print and PNG controls use deliberate same-origin navigation requests,
  // intercepted by the app. No JavaScript interface, native scoring or state sync.
  window.print = () => {
    const url = new URL(location.href); url.searchParams.set('cu-action', 'print'); location.assign(url.href);
  };
  document.addEventListener('click', async event => {
    const anchor = event.target.closest('a[href]'); if(!anchor) return;
    if(anchor.hasAttribute('download') && anchor.href.startsWith('blob:')) {
      event.preventDefault();
      try {
        const blob = await (await fetch(anchor.href)).blob();
        if(blob.type !== 'image/png' || blob.size > 4 * 1024 * 1024) throw Error('Export too large');
        const reader = new FileReader(); reader.onload = () => {
          const url = new URL(location.href); url.searchParams.set('cu-action','download');
          url.searchParams.set('cu-data',reader.result); location.assign(url.href);
        }; reader.readAsDataURL(blob);
      } catch { alert('Could not prepare this download. Use Open in browser to export it.'); }
    } else if(anchor.getAttribute('href').startsWith('#')) {
      // Leave article anchors and source/back links as native in-page navigation.
    } else {
      anchor.href = presentationLink(anchor.href, location.href, theme);
    }
  }, true);
  const ready = () => {
    // Existing footer links include Privacy, participation policy and the original
    // analytics-settings control with its original listener and consent behavior.
    apply();
    new MutationObserver(records => {
      if(records.some(record => record.addedNodes.length)) apply();
    }).observe(document.body, {childList:true, subtree:true});
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
}

if(typeof document!=='undefined' && embeddedOptions(location.href))startEmbeddedPresentation(embeddedOptions(location.href).theme);
