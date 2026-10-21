/* Real Google tag, local site fixture. All collection is intercepted BEFORE transmission.
 * Only allowlisted tag JS is fetched, without browser cookies/referrer. No GA receipt test.
 * NODE_PATH=<bundled modules> BROWSER_CHANNEL=chrome node tests/analytics-real-tag.cjs
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),live=process.env.ANALYTICS_REVIEW_LIVE==='1',out=path.join(root,'.local-review',live?'analytics-live-release':'analytics-activation-release');
fs.mkdirSync(out,{recursive:true});
const ID='G-H387MYJ9KJ',origin='https://courtumpire.com',source=fs.readFileSync(path.join(root,'analytics.js'),'utf8');
assert(source.includes('const ACCOUNT_SETTINGS_REVIEWED = true;'));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.xml':'application/xml','.txt':'text/plain'};
const scripts=new Map(),records=[],blocked=[],errors=[],checks=[],scenarios=[],siteAssetHashes={};
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
let stage='setup';
function decode(request){
 const u=new URL(request.url()),common=Object.fromEntries(u.searchParams),body=request.postData()||'';
 return (body?body.split(/\r?\n/):['']).map(line=>({stage,endpoint:u.origin+u.pathname,method:request.method(),parameters:{...common,...Object.fromEntries(new URLSearchParams(line))}}));
}
async function fixture(browser,{disabled=false,host=origin,viewport={width:1440,height:1000},seed}={}){
 const context=await browser.newContext({viewport,serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(u.origin===host){
   if(live&&host===origin&&!disabled){
    assert.equal(request.method(),'GET','Live site requests must be read-only');
    // Browser query markers stay in the fixture, never in requests to the live server.
    const response=await fetch(origin+u.pathname,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
    const body=Buffer.from(await response.arrayBuffer());siteAssetHashes[u.pathname]=crypto.createHash('sha256').update(body).digest('hex');
    if(u.pathname==='/analytics.js')assert.equal(body.toString().replace(/\r\n/g,'\n'),source.replace(/\r\n/g,'\n'),'Live activation source matches reviewed source, allowing checkout line endings only');
    return route.fulfill({status:response.status,contentType:response.headers.get('content-type')||'application/octet-stream',body});
   }
   let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
   let body=fs.readFileSync(file);if(disabled&&u.pathname==='/analytics.js')body=Buffer.from(body.toString().replace('const ACCOUNT_SETTINGS_REVIEWED = true;','const ACCOUNT_SETTINGS_REVIEWED = false;'));
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body});
  }
  if(u.hostname==='www.googletagmanager.com'&&['/gtag/js','/gtag/destination'].includes(u.pathname)&&[ID,'GT-K8G6D3F9'].includes(u.searchParams.get('id'))){
   if(!scripts.has(u.href)){
    const response=await fetch(u.href,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'CourtUmpire-local-payload-review','Cache-Control':'no-cache'}});
    assert(response.ok,'Real Google tag asset available');
    scripts.set(u.href,await response.text());
   }
   return route.fulfill({contentType:'application/javascript',body:scripts.get(u.href)});
  }
  if(/(^|\.)google-analytics\.com$/.test(u.hostname)||/\/g?\/collect$/.test(u.pathname)||u.hostname==='analytics.google.com'){
   records.push(...decode(request));
   // A local synthetic 204 avoids testing Google's network-error retry behavior.
   // No request is continued/fetched to any collection endpoint.
   return route.fulfill({status:204,body:''});
  }
  else blocked.push({stage,host:u.hostname,path:u.pathname});
  return route.abort('blockedbyclient');
 });
 if(seed)await context.addInitScript(({version,choice})=>{const savedAt=Date.now();localStorage.setItem('courtumpire.analytics.v1',JSON.stringify({version,choice,scope:version===3?'website-engagement-v3':'tool-usage-v2',savedAt,expiresAt:savedAt+180*86400000}));document.cookie='cu_consent='+choice+'.'+savedAt+';Path=/;Secure';},seed);
 const page=await context.newPage();page.on('pageerror',e=>errors.push({stage,message:e.message}));const visitPaths=[];
 return {context,page,get visits(){return visitPaths.length;},visitPaths,async open(url='/'){visitPaths.push(new URL(url,host).pathname);await page.goto(host+url);await page.waitForFunction(()=>!!window.CourtUmpireAnalytics);}};
}
const pause=page=>page.waitForTimeout(1600);
// Let the real tag batch naturally. Do not synthesize unload/pagehide or replace transports.
async function flush(page){await page.waitForTimeout(6000);}
const names=()=>records.map(r=>r.parameters.en).filter(Boolean);
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
 try{
  stage='guard-off';const guard=await fixture(browser,{disabled:true});await guard.open('/contact.html');
  for(const width of [1440,390]){await guard.page.setViewportSize({width,height:1000});await guard.page.screenshot({path:path.join(out,'consent-'+width+'.png'),fullPage:true});check(await guard.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Expanded consent copy has no overflow '+width);}
  await guard.page.locator('[data-choice=accepted]').click();await pause(guard.page);
  check(scripts.size===0&&records.length===0,'Disabled-guard safety fixture: acceptance loads no Google and makes no collection attempt');await guard.context.close();
  for(const host of ['http://localhost:4179','https://preview.example.test']){stage='excluded-host';const f=await fixture(browser,{host});await f.open();await f.page.locator('[data-choice=accepted]').click();await pause(f.page);check(scripts.size===0&&records.length===0,'Excluded host never starts Google: '+host);await f.context.close();}
  for(const version of [1,2])for(const choice of ['accepted','rejected']){stage='migration';const f=await fixture(browser,{seed:{version,choice}});await f.open();check((await f.page.evaluate(()=>CourtUmpireAnalytics.status().consent))===(choice==='accepted'?'unknown':'rejected'),'Legacy choice migration '+version+' '+choice);check(scripts.size===0&&records.length===0,'Legacy choice does not start Google');await f.context.close();}
  stage='fresh-rejection';const rejected=await fixture(browser,{});await rejected.open('/contact.html');await rejected.page.locator('[data-choice=rejected]').click();await rejected.page.locator('[value=problem]').check();await rejected.page.locator('[data-contact-copy]').click();await pause(rejected.page);check(records.length===0&&scripts.size===0,'Fresh rejection and real contact actions start no Google or collection');await rejected.context.close();
  stage='pre-consent';const f=await fixture(browser,{}),p=f.page;await f.open('/?qa_query=PRIVATE_QUERY#PRIVATE_FRAGMENT');await p.evaluate(()=>CourtUmpireAnalytics.track('google_play_click',{placement:'hero'}));await pause(p);check(records.length===0&&scripts.size===0,'No Google asset or collection before consent; pre-consent custom action dropped');
  stage='home-accepted';await p.locator('[data-choice=accepted]').click();await p.waitForFunction(()=>window.google_tag_manager);await pause(p);await flush(p);
  check(scripts.size>0,'Actual unmodified Google tag executed');check(names().includes('page_view'),'Actual Google page_view collection payload captured');
  stage='repeat-acceptance';const before=records.length;await p.locator('[data-analytics-settings]').click();await p.locator('[data-choice=accepted]').click();await flush(p);check(records.slice(before).filter(r=>r.parameters.en==='page_view').length===0,'Repeat acceptance adds no real page_view');
  stage='scroll';await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(10000);await flush(p);
  stage='history';const historyStart=records.length;await p.evaluate(()=>{history.pushState({},'','/?qa_query=HISTORY_PRIVATE#HISTORY_FRAGMENT');history.replaceState({},'','/?qa_query=HISTORY_PRIVATE#HISTORY_REPLACED');});await p.evaluate(()=>new Promise(resolve=>{addEventListener('popstate',resolve,{once:true});history.back();}));await flush(p);check(records.slice(historyStart).every(r=>r.parameters.en!=='page_view'),'pushState, replaceState and popstate add no page_view');
  stage='outbound';await p.locator('.site-header a[href*="play.google.com"]').click({noWaitAfter:true});await pause(p);await flush(p);for(const popup of f.context.pages().filter(page=>page!==p))await popup.close();
  stage='contact';await f.open('/contact.html?qa_query=CONTACT_PRIVATE#CONTACT_FRAGMENT');await p.waitForFunction(()=>document.body.dataset.contactReady==='true');await p.locator('[value=problem]').check();await p.locator('[data-contact-copy]').click();await p.locator('[data-contact-email]').evaluate(n=>n.addEventListener('click',e=>e.preventDefault()));await p.locator('[data-contact-email]').click();await flush(p);
  check(names().includes('contact_intent'),'Real contact-intent payload captured');
  for(const width of [1440,390]){await p.setViewportSize({width,height:1000});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'contact-'+width+'.png'),fullPage:true});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Contact has no overflow '+width);}
  stage='planner';await f.open('/practice-planner/?qa_query=PLANNER_PRIVATE');await p.waitForFunction(()=>document.body.dataset.practiceReady==='true');await p.locator('[name=duration]').selectOption('custom');await p.locator('[name=custom]').fill('65');await p.locator('#planner-form button[type=submit]').click();await flush(p);check(names().includes('plan_generated'),'Real successful planner payload captured');
  stage='checklist';await f.open('/clubs-coaches/session-checklist/?qa_query=CHECKLIST_PRIVATE');await p.waitForFunction(()=>document.body.dataset.toolsReady==='true');await p.locator('[name=text]').fill('PRIVATE_REMINDER private-person@example.test');await p.locator('#checklist-add button').click();await flush(p);check(names().includes('checklist_action'),'Real custom-reminder action payload captured');
  stage='score-export';await f.open('/play-score/result-card/?qa_query=SCORE_PRIVATE');await p.waitForFunction(()=>document.body.dataset.toolsReady==='true');await p.locator('[name=a]').fill('PRIVATE_PLAYER_A');await p.locator('[name=b]').fill('PRIVATE_PLAYER_B');await p.locator('[name=format]').selectOption('one-set');await p.locator('[name=a0]').fill('6');await p.locator('[name=b0]').fill('3');await p.locator('[data-clear-set="1"]').click();await p.getByRole('button',{name:'Preview result card',exact:true}).click();await p.locator('#download-card').waitFor({state:'visible'});await p.waitForFunction(()=>!document.querySelector('#download-card').disabled);const dl=p.waitForEvent('download');await p.locator('#download-card').click();await dl;await flush(p);check(names().includes('export_generated'),'Real generated score PNG payload captured');
  for(const key of ['q','s','search','query','keyword']){
   stage='search-'+key;await f.open('/tennis-drills/?'+key+'='+encodeURIComponent('PRIVATE_SEARCH_PLAYER private-search@example.test')+'&qa_query=SEARCH_URL_PRIVATE#SEARCH_FRAGMENT');await p.waitForFunction(()=>document.body.dataset.practiceReady==='true');
   if(key==='search')check(await p.locator('[name=search]').inputValue()==='PRIVATE_SEARCH_PLAYER private-search@example.test','Search deep link preserves local filter text');
   await p.locator('[name=search]').fill('PRIVATE_FILTER_TEXT');await p.locator('[name=search]').press('Enter');await flush(p);
  }
  stage='reference-link';await f.open('/tennis-drills/shadow-recovery/');await p.waitForFunction(()=>document.body.dataset.practiceReady==='true');await p.locator('.editorial summary').click();const ref=p.locator('.editorial a').first();await ref.evaluate(n=>{n.target='_blank';});await ref.click();await flush(p);for(const popup of f.context.pages().filter(page=>page!==p))await popup.close();
  stage='quiz';await f.open('/play-score/umpire-challenge/?qa_query=QUIZ_PRIVATE');await p.waitForFunction(()=>document.body.dataset.toolsReady==='true');await p.locator('#quiz-question input').first().check();await p.locator('[data-submit-answer]').click();await p.locator('[data-new-quiz]').click();check(await p.locator('dialog form').evaluate(form=>!/[?#]/.test(form.action)),'Dynamic confirmation form has a query-free destination');await p.getByRole('button',{name:'Cancel',exact:true}).click();await flush(p);check(await p.locator('#quiz-question').evaluate(form=>!/[?#]/.test(form.action)),'Dynamic quiz form has a query-free destination');
  stage='pdf-reference';const pdf=p.locator('.quiz-message a[href$=".pdf"]');await pdf.evaluate(n=>n.target='_blank');await pdf.click();await flush(p);for(const popup of f.context.pages().filter(page=>page!==p))await popup.close();
  const consentCommands=await p.evaluate(()=>dataLayer.filter(c=>c[0]==='consent').map(c=>({mode:c[1],values:c[2]})));check(consentCommands.length>=2&&consentCommands.every(c=>['ad_storage','ad_user_data','ad_personalization'].every(k=>c.values[k]==='denied')),'All three advertising consent types remain denied in actual tag commands');
  stage='withdrawal';await p.locator('[data-analytics-settings]').click();const withdrawalStart=records.length;await p.locator('[data-choice=rejected]').click();await p.waitForLoadState();await pause(p);await p.evaluate(()=>CourtUmpireAnalytics.track('page_view'));await flush(p);check(records.length===withdrawalStart,'No real collection after withdrawal, including reload');check(!(await f.context.cookies()).some(c=>/^(cu_ga|_ga)(_|$)/.test(c.name)),'Real Google analytics cookies cleared on withdrawal');await p.reload();await pause(p);check(records.length===withdrawalStart,'Rejection persists across reload');await f.context.close();
  scenarios.push('guard-off','local/preview exclusions','v1/v2 acceptance/rejection','fresh rejection','pre-consent','home acceptance','repeated acceptance','scroll','pushState/replaceState/popstate','outbound app/reference links','contact selection/copy/email','planner submission','custom checklist text','score PNG export','all five search keys','dynamic quiz/dialog forms','public ITF PDF file-link','advertising denials','withdrawal/reload');
  function decodedText(value){let text=JSON.stringify(value);for(let i=0;i<3;i++){try{const next=decodeURIComponent(text);if(next===text)break;text=next;}catch{break;}}return text.toLowerCase();}
  const payloadText=decodedText(records);const sensitive=['PRIVATE_QUERY','PRIVATE_FRAGMENT','HISTORY_PRIVATE','HISTORY_FRAGMENT','HISTORY_REPLACED','CONTACT_PRIVATE','CONTACT_FRAGMENT','PLANNER_PRIVATE','CHECKLIST_PRIVATE','SCORE_PRIVATE','QUIZ_PRIVATE','PRIVATE_REMINDER','private-person@example.test','PRIVATE_PLAYER_A','PRIVATE_PLAYER_B','PRIVATE_SEARCH_PLAYER','private-search@example.test','PRIVATE_FILTER_TEXT','SEARCH_URL_PRIVATE','SEARCH_FRAGMENT','mailto:','info@courtumpire.com'];
  const findings=sensitive.filter(s=>payloadText.includes(s.toLowerCase()));
  for(const key of ['q','s','search','query','keyword']){
   const probe=records.filter(r=>r.stage==='search-'+key);
   check(probe.some(r=>r.parameters.en==='page_view'),'Search-key probe reached a measured document: '+key);
   check(probe.every(r=>r.parameters.en!=='view_search_results'&&!Object.keys(r.parameters).some(k=>/search_term|^ep\.q_/.test(k))),'Disabled Site search emits no term for key: '+key);
  }
  check(records.every(r=>r.parameters.en!=='view_search_results'&&!Object.keys(r.parameters).some(k=>/search_term|^ep\.q_/.test(k))),'No automatic search event or search-term parameter in any captured payload');
  check(records.every(r=>!r.parameters.dl||r.parameters.dl.startsWith(origin+'/')&&!/[?#]/.test(r.parameters.dl)),'All captured page locations exclude query strings and fragments');
  check(records.every(r=>!r.parameters.dr),'All captured page referrers are blank');
  check(records.every(r=>r.parameters.dt==='CourtUmpire'),'All captured page titles are fixed');
  check(records.every(r=>r.parameters.gcs==='G101'&&r.parameters.npa==='1'),'Real payload consent is analytics granted, advertising storage denied, non-personalized');
  check(records.filter(r=>r.parameters.en==='page_view').length===f.visits,'Exactly one page_view for each actual document, including history/repeated acceptance checks');
  for(const route of new Set(f.visitPaths))check(records.filter(r=>r.parameters.en==='page_view'&&r.parameters.dl===origin+route).length===f.visitPaths.filter(p=>p===route).length,'Per-route page_view count matches actual visits: '+route);
  check(records.filter(r=>r.parameters['ep.form_destination']).every(r=>!/[?#]/.test(r.parameters['ep.form_destination'])),'All observed automatic form destinations exclude queries/fragments');
  const events=Object.fromEntries([...new Set(names())].map(n=>[n,records.filter(r=>r.parameters.en===n).length]));
  check(errors.length===0,'No application or real-tag JavaScript errors');
  const assets=[...scripts].map(([url,body])=>({url,bytes:Buffer.byteLength(body),sha256:crypto.createHash('sha256').update(body).digest('hex'),automaticConfiguration:(body.match(/\{"function":"__(?:ccd_em_[^"\s]+|ogt_auto_events|ccd_auto_redact|ogt_1p_data_v2)"[^\n]+?"tag_id":\d+\}/g)||[]).map(JSON.parse)}));
  for(const event of ['scroll','click','form_start','form_submit','file_download'])check(events[event]>0,'Applicable automatic event was observed: '+event);
  const {activities}=await import('../practice/catalogue.mjs'),{videoReady}=await import('../practice/render.mjs');check(activities.every(a=>!videoReady(a.video)),'No published activity video; YouTube automatic video events are not applicable');
  const eventCoverage=Object.fromEntries(['page_view','scroll','click','form_start','form_submit','view_search_results','file_download','video_start','video_progress','video_complete'].map(event=>{const sample=records.filter(r=>r.parameters.en===event),leaks=sensitive.filter(marker=>decodedText(sample).includes(marker.toLowerCase()));return [event,{count:sample.length,status:leaks.length?'privacy-blocker':sample.length?'observed-and-verified':event==='view_search_results'?'disabled-by-confirmed-setting-five-probes-verified':event.startsWith('video_')?'not-applicable':'not-triggered-not-proven-safe',privateMarkers:leaks}];}));
  const report={testedAt:new Date().toISOString(),browser:browser.version(),liveSite:live,siteAssetHashes,safetyStatus:findings.length?'blocked':'verified-for-applicable-events',productionGuard:true,servedCopyGuardOverride:false,disabledGuardSafetyFixture:true,collectionRequestsTransmitted:0,thirdPartyScriptsModified:false,checks,scenarios,assets,eventCounts:events,eventCoverage,consentCommands,pageVisits:f.visitPaths,sensitiveMarkersFound:findings,blockedOtherRequests:blocked,pageErrors:errors,records,limitations:['No GA receipt verification or remote setting mutation.','Absence of an automatic event does not establish safe payloads for that event.','Contact mailto navigation is prevented to avoid opening an email client; observed contact payloads are checked.','PNG/blob export is custom export_generated; file_download uses the existing public ITF PDF reference.','No published video or YouTube embed is present; retest if video content is introduced.']};
  fs.writeFileSync(path.join(out,'real-tag-payloads.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:checks.length,assets:assets.length,eventCounts:events,sensitiveMarkersFound:findings,otherBlocked:blocked,collectionRequestsTransmitted:0},null,2));
  if(findings.length){console.error('BLOCKED: private marker in actual collection payload. Inspect real-tag-payloads.json; keep delivery disabled until the specific automatic-event issue is resolved.');process.exitCode=1;}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'incomplete-real-tag.json'),JSON.stringify({stage,error:e.message,records,blocked,errors},null,2));process.exitCode=1;});
