/* Basic opt-in: no Google code or requests until a saved, explicit acceptance.
 * See README for the required GA4 Enhanced Measurement account settings.
 */
(() => {
  'use strict';
  if (window.courtUmpireConsentLoaded) return;
  window.courtUmpireConsentLoaded = true;

  const ID = 'G-H387MYJ9KJ';
  const KEY = 'courtumpire.analytics.v1';
  const CONSENT_VERSION = 2, SCOPE = 'tool-usage-v2';
  // Fail closed until the owner verifies the existing GA4 stream settings (see docs/ANALYTICS-USAGE.md).
  const ACCOUNT_SETTINGS_REVIEWED = false;
  const debug = ['localhost','127.0.0.1','[::1]'].includes(location.hostname) && new URL(location.href).searchParams.get('analytics_debug') === '1';
  const COOKIE = 'cu_consent';
  const TTL = 180 * 24 * 60 * 60 * 1000;
  const production = location.hostname === 'courtumpire.com' && location.protocol === 'https:';
  const paths = new Set(["/","/contact.html","/privacy.html","/impressum.html","/practice/","/practice-planner/","/practice/players/","/tennis-drills/","/tennis-drills/1-player/","/tennis-drills/2-players/","/tennis-drills/3-players/","/tennis-drills/4-players/","/tennis-drills/shadow-recovery/","/tennis-drills/solo-serve-targets/","/tennis-drills/serve-placement-ladder/","/tennis-drills/wall-consistency/","/tennis-drills/crosscourt-rally/","/tennis-drills/down-the-line-target/","/tennis-drills/cooperative-volley/","/tennis-drills/serve-return-target/","/tennis-drills/two-against-one/","/tennis-drills/challenger-singles/","/tennis-drills/feeder-rally-rotation/","/tennis-drills/three-player-volley/","/tennis-drills/doubles-partner-rotation/","/tennis-drills/team-consistency/","/tennis-drills/doubles-serve-return/","/tennis-drills/net-baseline-teams/","/tennis-drills/racket-bounce-control/","/tennis-drills/serve-toss-and-catch/","/tennis-drills/self-feed-drive-recovery/","/tennis-drills/approach-split-step-rehearsal/","/tennis-drills/wall-soft-volley-control/","/tennis-drills/self-feed-high-clearance-lob/","/tennis-drills/mini-court-depth-ladder/","/tennis-drills/forehand-backhand-eight/","/tennis-drills/approach-and-first-volley/","/tennis-drills/defensive-lob-and-recover/","/tennis-drills/serve-plus-one-decision/","/tennis-drills/crosscourt-change-line/","/tennis-drills/slice-low-lane/","/tennis-drills/drop-shot-recover/","/tennis-drills/controlled-overhead-feed/","/tennis-drills/service-box-angle-chess/","/tennis-drills/two-returner-serve-lanes/","/tennis-drills/three-player-poach-call/","/tennis-drills/middle-ball-call-volley/","/tennis-drills/lob-cover-switch-trio/","/tennis-drills/call-the-direction/","/tennis-drills/short-deep-feeder-triangle/","/tennis-drills/passer-front-back-pair/","/tennis-drills/return-depth-observer/","/tennis-drills/rally-recover-relay/","/tennis-drills/parallel-lane-pairs/","/tennis-drills/four-corner-one-ball/","/tennis-drills/paired-approach-transition/","/tennis-drills/doubles-lob-switch-point/","/tennis-drills/touch-doubles-boxes/","/tennis-drills/middle-then-wide-doubles/","/tennis-drills/return-and-charge-pair/","/tennis-drills/alley-pass-and-protect/","/tennis-drills/pressure-point-team-budget/","/play-score/","/play-score/scoreboard/","/play-score/tiebreak-calculator/","/play-score/result-card/","/play-score/umpire-challenge/","/clubs-coaches/","/clubs-coaches/rotation-planner/","/clubs-coaches/tournament-rules/","/clubs-coaches/match-score-sheet/","/clubs-coaches/session-checklist/","/clubs-coaches/tennis-kit/","/site-map/","/tools/","/404.html","/index.html"]);
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
      if (!value || ![1,CONSENT_VERSION].includes(value.version) || !['accepted', 'rejected'].includes(value.choice) ||
          !Number.isSafeInteger(value.savedAt) || !Number.isSafeInteger(value.expiresAt) ||
          value.savedAt > Date.now() || value.expiresAt - value.savedAt !== TTL || value.expiresAt <= Date.now()) return null;
      if (value.choice === 'accepted' && (value.version !== CONSENT_VERSION || value.scope !== SCOPE)) return null;
      // Both stores must agree before a previous acceptance can start Google.
      if (value.choice === 'accepted' && cookieValue() !== 'accepted.' + value.savedAt) return null;
      return value;
    } catch { return null; }
  }

  function saveChoice(choice) {
    const savedAt = Date.now();
    const value = { version: CONSENT_VERSION, scope: SCOPE, choice, savedAt, expiresAt: savedAt + TTL };
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

  const toolIds={contact:'contact',planner:'practice_planner',scoreboard:'scoreboard',helper:'tiebreak_calculator',result:'result_card',rotation:'rotation',checklist:'checklists',rules:'rules', 'score-sheet':'score_sheet',quiz:'umpire_challenge',kit:'club_kit'};
  const destinationIds={'/':'app','/practice/':'practice','/play-score/':'play','/clubs-coaches/':'clubs','/practice-planner/':'practice_planner','/play-score/scoreboard/':'scoreboard','/play-score/result-card/':'result_card','/play-score/tiebreak-calculator/':'tiebreak_calculator','/clubs-coaches/rotation-planner/':'rotation','/clubs-coaches/session-checklist/':'checklists','/clubs-coaches/tournament-rules/':'rules','/clubs-coaches/match-score-sheet/':'score_sheet','/clubs-coaches/tennis-kit/':'club_kit'};
  const values={tool_id:Object.values(toolIds),checklist_type:['session','organizer'],action:['add','check','remove','restore','restore_defaults','delete'],export_format:['png'],document_type:['practice_plan','rotation','checklist','rules','score_sheet','result_card','scoring_reference'],source_placement:['header','footer'],planning_mode:['duration','rounds'],match_format:['one-set','best-three','match-tiebreak'],games_per_set:['4','6'],error_category:['validation','storage','export','asset'],destination_id:Object.values(destinationIds),placement:['header','hero','download_section'],contact_category:['general','help','problem','improvement','clubs','privacy'],contact_action:['select','email','copy'],copy_result:['success','failure'],match_status:['in_progress','completed'],question_count:[5,10,20,100],player_count:['1','2','3','4'],source_context:['library','activity','players','planner']};
  const schemas={quiz_start:['tool_id','question_count'],quiz_complete:['tool_id','question_count','correct_count'],score_reset:['tool_id'],drill_used:['player_count','source_context'],contact_intent:['contact_category','contact_action','copy_result'],page_view:[],tool_view:['tool_id'],tool_interaction:['tool_id'],plan_generated:['tool_id','planning_mode'],match_completed:['tool_id','match_format','games_per_set'],export_generated:['tool_id','document_type','export_format','match_format','games_per_set','match_status'],print_requested:['document_type'],google_play_click:['placement'],checklist_selected:['tool_id','checklist_type'],checklist_action:['tool_id','checklist_type','action'],tool_error:['tool_id','error_category'],navigation_selected:['destination_id','source_placement']};
  const seen=new Set();
  function track(name,parameters={},options={}) {
    // Never buffer pre-consent actions or arbitrary/free-text parameters.
    const choice=readChoice();if(fallback||!accepted||choice?.choice!=='accepted'||!paths.has(location.pathname)||(!debug&&(!production||!started||!ACCOUNT_SETTINGS_REVIEWED)))return false;
    if(!Object.hasOwn(schemas,name))return false;const schema=schemas[name];if(!schema||!parameters||typeof parameters!=='object'||Object.keys(parameters).some(key=>!schema.includes(key)))return false;
    const safe={};for(const [key,value]of Object.entries(parameters)){if(key==='correct_count'){if(!Number.isInteger(value)||value<0||value>100||!values.question_count.includes(parameters.question_count)||value>parameters.question_count)return false;}else if(!values[key]?.includes(value))return false;safe[key]=value;}
    if(schema.length&&!safe[schema[0]])return false;
    const identity=name+JSON.stringify(safe);if(options.once&&seen.has(identity))return false;
    if(options.once)seen.add(identity);
    if(debug){window.courtUmpireAnalyticsDebug??=[];if(window.courtUmpireAnalyticsDebug.length<100)window.courtUmpireAnalyticsDebug.push({event:name,...safe});return true;}
    try{window.gtag('event',name,{...safe,send_to:ID,page_location:pageLocation,page_referrer:'',page_title:'CourtUmpire'});return true;}catch{return false;}
  }
  function sendCurrentView(){track('page_view',{}, {once:true});const tool=toolIds[document.body.dataset.page];if(tool)track('tool_view',{tool_id:tool},{once:true});}
  window.CourtUmpireAnalytics=Object.freeze({track,status:()=>({consent:readChoice()?.choice||'unknown',scope:SCOPE,production,deliveryReady:ACCOUNT_SETTINGS_REVIEWED,started,debug})});

  const panel = document.createElement('section');
  panel.className = 'consent-panel';
  panel.setAttribute('aria-labelledby', 'consent-title');
  panel.innerHTML = '<div class="container consent-inner"><div><h2 id="consent-title">Optional website analytics</h2>' +
    '<p>Allow Google Analytics to measure page visits, tool use, successful results, export generation, local quiz starts/results, score resets, contact intent and Google Play link clicks? Names, reminders, event details and logos stay out of these events. ' +
    'Your choice lasts 180 days. <a href="/privacy.html#website-analytics">Privacy Policy</a></p>' +
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
    seen.clear();
    if (debug) window.courtUmpireAnalyticsDebug = [];
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
    if (debug) sendCurrentView();
    if (!accepted || !production || !ACCOUNT_SETTINGS_REVIEWED || !paths.has(location.pathname) || started) return;
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
      page_title: 'CourtUmpire', allow_google_signals: false,
      allow_ad_personalization_signals: false, cookie_prefix: 'cu',
      cookie_domain: 'courtumpire.com', cookie_path: '/',
      cookie_expires: Math.floor((choice.expiresAt - Date.now()) / 1000), cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    sendCurrentView();
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
    if (link && link.href === 'https://play.google.com/store/apps/details?id=com.mahmoud.courtvoice') track('google_play_click', {placement:link.dataset.playPlacement});
    const nav=event.target.closest('.site-header nav a,.site-footer a');
    if(nav){const route=new URL(nav.href),destination=destinationIds[route.pathname];if(route.origin===location.origin&&destination)track('navigation_selected',{destination_id:destination,source_placement:nav.closest('.site-footer')?'footer':'header'});}
  });
  for(const eventName of ['input','change','submit','click']) document.addEventListener(eventName,event=>{
    if(!event.isTrusted||!event.target.closest('.tool-form,.planner-form,#scoreboard,#quiz-area'))return;
    const tool=toolIds[document.body.dataset.page];if(tool)track('tool_interaction',{tool_id:tool},{once:true});
  },true);

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
    try { const previous=JSON.parse(localStorage.getItem(KEY));if(previous?.choice==='accepted'&&previous.version!==CONSENT_VERSION)status.textContent='Analytics now includes optional tool usage and outcomes. Please choose again for this expanded purpose.'; } catch {}
  }
})();
