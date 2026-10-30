// Temporary isolated harness. No scheduled handler, public route or local auth.
import {owner,csrf} from '../../backend/src/auth.mjs';
import {createHandler} from '../../backend/src/worker.mjs';
import {calculateChanges} from '../../weekly-core/rankings.mjs';
import {cleanup} from '../../backend/src/retention.mjs';
import {isolation} from './isolation.mjs';
import fixtures from '../../.weekly-private/paid-trial/live-fixtures.generated.mjs';
import client from './client.js.txt';
const handler=createHandler();
// Owner waived only the larger live stress sequence, not a production size cap.
const steps=[0,1,2,3,4,5,6,7,8,9,15,16,17,18,19,20,21,22,23];
const json=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow'}});
const check=(ok,label)=>{if(!ok)throw Error(label);};
export default {async fetch(request,bound){
 let env;
 try{
  env=await isolation(request,bound);const actor=await owner(request,env),url=new URL(request.url);
  const call=async(path,body)=>{
   const headers=new Headers(request.headers);headers.delete('x-cu-test-policy');headers.delete('x-cu-test-signing');
   headers.set('content-type','application/json');
   return handler(new Request(env.ADMIN_ORIGIN+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})}),env);
  };
  const get=async path=>{const r=await call('/admin/api/publishing/'+path);check(r.ok,'Read failed');return r.json();};
  const read=async path=>handler(new Request(env.PUBLIC_ORIGIN+path),env);
  if(url.pathname==='/publishing-test/')return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Private publication tests</title></head><body><h1>Isolated Paid-plan publication tests</h1><p>Dummy data only. No public website writes. Stop after each operation for CPU review.</p><button id="next">Run next isolated operation</button><pre id="result" role="status"></pre><script src="/publishing-test/client.js"></script></body></html>',{headers:{'content-type':'text/html','cache-control':'private, no-store','x-robots-tag':'noindex','content-security-policy':"default-src 'none'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
  if(url.pathname==='/publishing-test/client.js')return new Response(client,{headers:{'content-type':'text/javascript','cache-control':'private, no-store'}});
  if(url.pathname==='/publishing-test/session')return call('/admin/api/session');
  if(url.pathname==='/publishing-test/status'){const runs=(await env.DB.prepare('SELECT step,started,finished,passed,label FROM publishing_test_runs ORDER BY step').all()).results;return json({runs,nextStep:steps[runs.length]??null,skipped:[10,11,12,13,14]});}
  if(url.pathname==='/publishing-test/fixture'&&request.method==='GET'){
   const step=Number(url.searchParams.get('step'));check(steps.includes(step),'Step');
   return json({article:fixtures.articles[step<15?Math.floor(step/5):0],cover:fixtures.cover});
  }
  if(url.pathname!=='/publishing-test/step'||request.method!=='POST')return json({error:'Not found'},404);
  await csrf(request,env,actor);
  const input=await request.text();check(new TextEncoder().encode(input).length<=800000,'Body size');const {step,article,cover}=JSON.parse(input);
  check(steps.includes(step),'Step');
  // Carry the full bounded article and cover through the admin gateway. This
  // fixture-integrity check adds conservative test CPU; production validation
  // still runs below. No client HTML or client validation is trusted.
  check(JSON.stringify(article)===JSON.stringify(fixtures.articles[step<15?Math.floor(step/5):0])&&cover===fixtures.cover,'Fixture mismatch');
  const prior=(await env.DB.prepare('SELECT step,passed FROM publishing_test_runs ORDER BY step').all()).results;
  check(steps[prior.length]===step&&prior.every((r,i)=>r.step===steps[i]&&r.passed===1),'Previous result missing or failed; no automatic retry');
  const started=new Date().toISOString();await env.DB.prepare('INSERT INTO publishing_test_runs(step,started,label,passed) VALUES(?,?,?,0)').bind(step,started,'running').run();
  let label;
  try{
   const mutate=async body=>{const r=await call('/admin/api/publishing/mutate',body);check(r.ok,'Mutation HTTP '+r.status);return r.json();};
   const proposal=async(a,action='publish',old=null)=>({key:crypto.randomUUID(),action,article:a,confirmId:a.id,expectedVersion:(await get('state')).version,expectedRevision:old?.revision??null,expectedHash:old?.hash??null,cover});
   const manage=async(id,action)=>{const e=await get('edition?id='+id),p=await proposal(e.article,action,e);delete p.article;p.id=id;return mutate(p);};
   if(step<15){
    const group=Math.floor(step/5),phase=step%5;let a=structuredClone(article),old=null;
    if(phase>=3){old=await get('edition?id='+a.id);a=structuredClone(old.article);a.title+=' · update '+(phase-2);}
    const state=await get('ranking-context?id='+a.id);calculateChanges(a,old?old.comparison:state.snapshots[0]||null);
    const p=await proposal(a,phase>=3?'update':'publish',old);
    label=[102,306,510][group]+' results / '+['preview first','preview repeat','publish','update first','update repeat'][phase];
    if(phase<2){const r=await call('/admin/api/publishing/preview',p);check(r.ok,'Preview HTTP '+r.status);const data=await r.json();check(JSON.stringify(data).length>20000,'Full preview missing');check((await read('/weekly/'+a.slug+'/')).status===404,'Private preview exposed');}
    else{const result=await mutate(p);check(result.id===a.id,'ID changed');const latest=await get('edition?id='+a.id);if(old){check(latest.article.publishedAt===old.article.publishedAt,'Original date');check(latest.article.editionNumber===old.article.editionNumber,'Edition number');check(JSON.stringify(latest.comparison)===JSON.stringify(old.comparison),'Snapshot changed');}
     const r=await read('/weekly/'+a.slug+'/');check(r.status===200&&r.headers.get('cache-control')==='no-store','Direct read');check((await r.text()).includes(a.title.replaceAll('&','&amp;')),'Latest HTML');}
   }else{
    const id=fixtures.articles[0].id,slug=fixtures.articles[0].slug;
    if(step===15){label='Newest-first archive, feed, sitemap and private edit';const html=await(await read('/weekly/')).text();const ids=fixtures.articles.slice(0,2).reverse().map(a=>html.indexOf(a.slug));check(ids.every(n=>n>=0)&&ids[0]<ids[1],'Newest first');for(const path of ['/weekly/feed.xml','/weekly/sitemap-1.xml'])check((await(await read(path)).text()).includes(slug),'Feed/sitemap');const e=await get('edition?id='+id),a={...e.article,title:'PRIVATE EDIT NOT LIVE'},p=await proposal(a,'update',e);check((await call('/admin/api/publishing/preview',p)).ok,'Private edit preview');check(!(await(await read('/weekly/'+slug+'/')).text()).includes(a.title),'Edit changed public');}
    if(step===16){label='Unpublish retains engagement and withdraws direct links';await env.DB.prepare('INSERT INTO reactions(article_id,browser_id,value,updated_at) VALUES(?,?,1,?)').bind(id,'isolated-dummy',new Date().toISOString()).run();await manage(id,'unpublish');check((await read('/weekly/'+slug+'/')).status===410,'Unpublish direct');for(const path of ['/weekly/','/weekly/feed.xml','/weekly/sitemap-1.xml'])check(!(await(await read(path)).text()).includes(slug),'Unpublish index');check((await env.DB.prepare('SELECT count(*) n FROM reactions WHERE article_id=?').bind(id).first()).n===1,'Engagement removed');}
    if(step===17){label='Trash and Restore stay private';await manage(id,'trash');await manage(id,'restore');check((await get('edition?id='+id)).status==='unpublished','Restore state');check((await read('/weekly/'+slug+'/')).status===410,'Restore exposed');}
    if(step===18){label='Republish, idempotent retry and stale conflict';const e=await get('edition?id='+id),p=await proposal({...e.article,title:e.article.title+' · restored'},'update',e),r=await mutate(p);check(JSON.stringify(await mutate(p))===JSON.stringify(r),'Replay differs');check((await call('/admin/api/publishing/mutate',{...p,key:crypto.randomUUID()})).status===409,'Stale edit accepted');check((await read('/weekly/'+slug+'/')).status===200,'Republish');}
    if(step===19){label='Published revision recovery and stable identity';const e=await get('edition?id='+id),old=await get('revision?id='+id+'&revision=1');old.article.updatedAt=e.article.updatedAt;await mutate(await proposal(old.article,'update',e));const current=await get('edition?id='+id);check(current.article.publishedAt===e.article.publishedAt&&current.article.title===old.article.title,'Recovery');}
    if(step===20){label='Export integrity';const b=await get('export?id='+id);check(b.revisions.length>=3&&b.edition.article.id===id,'Export incomplete');for(const r of b.revisions){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(r.content))),x=>x.toString(16).padStart(2,'0')).join('');check(hash===r.hash,'Export hash');}}
    if(step===21){label='Permanent deletion withdraws content, retains engagement';await manage(id,'trash');await manage(id,'purge');check((await read('/weekly/'+slug+'/')).status===410,'Purge exposed');check((await env.DB.prepare('SELECT count(*) n FROM edition_revisions WHERE edition_id=?').bind(id).first()).n===0,'History survived purge');check((await env.DB.prepare('SELECT count(*) n FROM reactions WHERE article_id=?').bind(id).first()).n===1,'Engagement silently removed');}
    if(step===22){label='Missing/forged assertion, wrong origin, CSRF and hold';for(const token of ['','invalid']){const h=new Headers(request.headers);h.set('cf-access-jwt-assertion',token);check((await handler(new Request(env.ADMIN_ORIGIN+'/admin/api/publishing/state',{headers:h}),env)).status===403,'Unauthorized');}const h=new Headers(request.headers);h.set('origin','https://invalid.example');h.set('content-type','application/json');check((await handler(new Request(env.ADMIN_ORIGIN+'/admin/api/publishing/mutate',{method:'POST',headers:h,body:'{}'}),env)).status===403,'CSRF');const e=await get('edition?id='+fixtures.articles[1].id),p=await proposal({...e.article,title:e.article.title+' held'},'update',e);const r=await handler(new Request(env.ADMIN_ORIGIN+'/admin/api/publishing/mutate',{method:'POST',headers:request.headers,body:JSON.stringify(p)}),{...env,PUBLISHING_WRITES_OPEN:'false'});check(r.status===503,'Write hold');}
    if(step===23){label='Hourly/daily retention handler';await env.DB.prepare("INSERT INTO limits VALUES('expired-dummy',1,0)").run();await cleanup(env);await cleanup(env,{full:true});const rows=(await env.DB.prepare('SELECT kind,last_success,failed FROM retention_health').all()).results;check(rows.length===2&&rows.every(r=>r.last_success&&r.failed===0),'Cleanup health');check(!(await env.DB.prepare("SELECT key FROM limits WHERE key='expired-dummy'").first()),'Expired abuse entry');}
   }
   const finished=new Date().toISOString();await env.DB.prepare('UPDATE publishing_test_runs SET finished=?,label=?,passed=1 WHERE step=?').bind(finished,label,step).run();return json({step,label,passed:true,started,finished});
  }catch{await env.DB.prepare('UPDATE publishing_test_runs SET finished=?,label=? WHERE step=?').bind(new Date().toISOString(),'FAILED — inspect sanitized state',step).run();return json({step,passed:false,error:'Isolated gate failed; do not retry automatically.'},503);}
 }catch{return json({error:'Isolated test unavailable.'},403);}
}};
