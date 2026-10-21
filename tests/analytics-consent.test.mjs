// Tests our integration in a controlled DOM/gtag harness; not Google's tag or live receipt.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {routeDefinitions} from '../practice/routes.mjs';
const source = fs.readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
const key = 'courtumpire.analytics.v1', ttl = 180 * 86400000;
test('local tool forms cannot inherit visitor query strings in automatic form destinations',()=>{
  let forms=0;
  for(const route of routeDefinitions){
    const file=new URL('..'+(route.path.endsWith('/')?route.path+'index.html':route.path),import.meta.url);
    if(!fs.existsSync(file))continue;
    for(const [tag] of fs.readFileSync(file,'utf8').matchAll(/<form\b[^>]*>/g)){
      forms++;
      const action=tag.match(/\saction="([^"]+)"/i)?.[1];
      assert.equal(action,route.path,'explicit same-origin public destination for '+route.path);
      assert.doesNotMatch(action,/[?#]/);
    }
  }
  assert.ok(forms>=10,'cover the generated local forms, including club event details');
});
function fixture({version, choice = 'accepted', cookie = true, enabled = false, blocked = false, origin = 'https://courtumpire.com', query = ''} = {}) {
  const storage = new Map(), cookies = new Map(), scripts = [], replacements = [], reloads = [];
  const savedAt = Date.now() - 1000;
  if (version) {
    storage.set(key, JSON.stringify({version, scope: version === 3 ? 'website-engagement-v3' : 'tool-usage-v2', choice, savedAt, expiresAt: savedAt + ttl}));
    if (cookie) cookies.set('cu_consent', choice + '.' + savedAt);
  }
  function element() {return {hidden:false, isConnected:true, dataset:{}, listeners:{}, addEventListener(n,fn){this.listeners[n]=fn;}, setAttribute(){}, contains(){return false;}, focus(){}, after(){}};}
  const panel=element(), status=element(), accept=element(), close=element(), settings=element(), header=element();
  panel.querySelector=s=>s.includes('role=')?status:s.includes('data-choice')?accept:close;
  const location={href:origin+'/' + query, hostname:new URL(origin).hostname, protocol:new URL(origin).protocol, pathname:'/', origin, replace:u=>reloads.push(u), reload:()=>reloads.push('reload')};
  const document={body:{dataset:{page:'planner'}},activeElement:null,head:{append:n=>scripts.push(n)},createElement:tag=>tag==='section'?panel:element(),querySelector:s=>s==='.site-header'?header:settings,querySelectorAll:()=>[],addEventListener(){}};
  Object.defineProperty(document,'cookie',{get:()=>[...cookies].map(([k,v])=>k+'='+v).join('; '),set:value=>{const [pair]=value.split(';'),i=pair.indexOf('='),k=pair.slice(0,i);if(value.includes('Max-Age=0'))cookies.delete(k);else cookies.set(k,pair.slice(i+1));}});
  const sandbox={document,location,URL,Date,Set,Object,JSON,Number,Math,clearTimeout(){},setTimeout(){return 1;},history:{replaceState(_a,_b,url){replacements.push(url.href);location.href=url.href;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v);}},addEventListener(){}};
  sandbox.window=sandbox;
  vm.runInNewContext(enabled?source.replace('const ACCOUNT_SETTINGS_REVIEWED = false;', 'const ACCOUNT_SETTINGS_REVIEWED = true;'):source,sandbox);
  const select=choice=>panel.listeners.click({target:{closest:()=>({dataset:{choice}})}});
  return {sandbox,select,panel,status,storage,cookies,scripts,replacements,reloads,commands:()=>Array.from(sandbox.dataLayer||[],x=>Array.from(x))};
}
test('production guard stays off even with fresh version-3 consent',()=>{
  const f=fixture({version:3});assert.equal(f.scripts.length,0);assert.equal(f.sandbox.CourtUmpireAnalytics.status().deliveryReady,false);assert.equal(f.sandbox.CourtUmpireAnalytics.track('page_view'),false);
});
test('both older acceptance versions require a fresh choice; both older rejections persist',()=>{
  for(const version of [1,2]){const a=fixture({version,enabled:true});assert.equal(a.panel.hidden,false);assert.equal(a.scripts.length,0);assert.equal(a.sandbox.CourtUmpireAnalytics.status().consent,'unknown');const r=fixture({version,choice:'rejected',enabled:true});assert.equal(r.panel.hidden,true);assert.equal(r.sandbox.CourtUmpireAnalytics.status().consent,'rejected');assert.equal(r.scripts.length,0);}
});
test('acceptance initializes once, never grants ads, and repeated acceptance does not change history',()=>{
  const f=fixture({enabled:true});assert.equal(f.scripts.length,0);f.select('accepted');f.select('accepted');
  assert.equal(f.scripts.length,1);assert.equal(f.replacements.length,0);
  const calls=f.commands();assert.equal(calls.filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);
  assert.equal(calls.filter(x=>x[0]==='config').length,1);
  for(const c of calls.filter(x=>x[0]==='consent'))for(const k of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(c[2][k],'denied');
  const stored=JSON.parse(f.storage.get(key));assert.equal(stored.version,3);assert.equal(stored.scope,'website-engagement-v3');assert.equal(stored.expiresAt-stored.savedAt,ttl);
});
test('withdrawal removes analytics cookies and persists rejection before reload',()=>{
  const f=fixture({version:3,enabled:true});f.cookies.set('cu_ga','test');f.cookies.set('_ga_test','test');f.select('rejected');assert.equal(f.sandbox['ga-disable-G-H387MYJ9KJ'],true);assert.equal(f.cookies.has('cu_ga'),false);assert.equal(f.cookies.has('_ga_test'),false);assert.equal(JSON.parse(f.storage.get(key)).choice,'rejected');assert.equal(f.reloads.length,1);assert.equal(f.sandbox.CourtUmpireAnalytics.track('page_view'),false);
});
test('missing consent cookie, unavailable storage, preview and localhost never start Google',()=>{
  assert.equal(fixture({version:3,cookie:false,enabled:true}).scripts.length,0);
  const b=fixture({blocked:true,enabled:true});b.select('accepted');assert.equal(b.scripts.length,0);assert.match(b.status.textContent,/could not be saved/);
  for(const origin of ['http://localhost','https://preview.example.test']){const f=fixture({origin,version:3,enabled:true});assert.equal(f.scripts.length,0);}
});
test('custom payloads reject free text and strip URL queries/fragments',()=>{
  const f=fixture({enabled:true,query:'?name=SensitiveName#private'});f.select('accepted');
  assert.equal(f.sandbox.CourtUmpireAnalytics.track('contact_intent',{contact_category:'help',contact_action:'email',email:'private@example.test'}),false);
  assert.equal(f.sandbox.CourtUmpireAnalytics.track('form_submit',{tool_id:'practice_planner'}),false);
  assert.equal(f.sandbox.CourtUmpireAnalytics.track('contact_intent',{contact_category:'help',contact_action:'email'}),true);
  assert.doesNotMatch(JSON.stringify(f.commands()),/SensitiveName|private@example|#private/);
});
