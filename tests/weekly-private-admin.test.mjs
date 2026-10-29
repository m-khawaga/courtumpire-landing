import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Miniflare} from 'miniflare';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT,jwtVerify} from 'jose';
import {owner} from '../backend/src/auth.mjs';
import {verifyIndependentMfa} from '../backend/src/access-policy.mjs';
import {createPrivateHandler} from '../backend/private-admin/worker.mjs';
import {cleanup,scheduled} from '../backend/src/retention.mjs';
import {fixture,blank} from './weekly-fixture.mjs';
import {validate,validateWorkingDraft} from '../weekly-core/contract.mjs';
import {article} from '../weekly-core/render.mjs';
import {hash,updateEdition} from '../weekly-core/store.mjs';
let mf,env,secure,token,key,csrf,testKeys;
const origin='https://admin.courtumpire.com';
const req=(path,body,headers={},host=origin)=>new Request(host+path,{method:body?'POST':'GET',headers:{origin,'cf-access-jwt-assertion':token,...(body?{'content-type':'application/json','x-csrf-token':csrf}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
const call=(p,b,h,host)=>secure(req(p,b,h,host),env);
const data=async r=>({status:r.status,...await r.json()});
async function mint(changes={},aud='admin-aud',iss='https://courtumpire.cloudflareaccess.com',expiry='5m'){
 return new SignJWT({email:'info@wynctec.com',amr:['pwd','mfa'],...changes}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('test-owner').setIssuedAt().setIssuer(iss).setAudience(aud).setExpirationTime(expiry).sign(key);
}
before(async()=>{
 mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-08-06',d1Databases:['DRAFTS','DB']});
 env={DRAFTS:await mf.getD1Database('DRAFTS'),DB:await mf.getD1Database('DB'),ADMIN_ORIGIN:origin,OWNER_EMAILS:'info@wynctec.com',ACCESS_ISSUER:'https://courtumpire.cloudflareaccess.com',ACCESS_AUD:'admin-aud',REQUIRE_ACCESS_MFA:'true',SIGNING_SECRET:'test-only-secret-more-than-32-characters',PRIVATE_ASSETS:{'/authoring/index.html':{type:'text/html',body:'<h1>Private editor</h1>'}}};
 await env.DRAFTS.exec(fs.readFileSync('backend/private-admin/migrations/0001_drafts.sql','utf8').replace(/\n/g,' '));
 for(const f of ['0001_weekly.sql','0002_comment_reactions.sql','0003_retention_health.sql'])await env.DB.exec(fs.readFileSync('backend/migrations/'+f,'utf8').replace(/\n/g,' '));
 const pair=await generateKeyPair('RS256');key=pair.privateKey;const jwk=await exportJWK(pair.publicKey);jwk.kid='test';const jwks=createLocalJWKSet({keys:[jwk]});testKeys=jwks;
 secure=createPrivateHandler({owner:(r,e)=>owner(r,e,(t,_j,o)=>jwtVerify(t,jwks,o))});
 token=await mint();csrf=(await data(await call('/private/api/session'))).csrf;
});
after(async()=>{await mf?.dispose();});
test('every private asset, preview/API and moderation route rejects missing/forged/wrong identity, issuer, audience, expired or no-MFA token',async()=>{
 for(const t of ['', 'forged',await mint({email:'other@example.invalid'}),await mint({email:'other@wynctec.com'}),await mint({},'other-account-aud'),await mint({},'admin-aud','https://other.cloudflareaccess.com'),await mint({},'admin-aud',env.ACCESS_ISSUER,'-1s'),await mint({amr:['otp']})]){
  for(const p of ['/','/authoring/editor.mjs','/private/api/drafts','/private/api/drafts/00000000-0000-0000-0000-000000000000','/admin','/admin/api/comments']){
   assert.equal((await call(p,null,{'cf-access-jwt-assertion':t,'cf-access-authenticated-user-email':'info@wynctec.com'})).status,403);
  }
 }
 for(const host of ['https://fake.workers.dev','https://preview.example','https://weekly-api.courtumpire.com'])assert.equal((await call('/',null,{},host)).status,403);
 assert.equal((await createPrivateHandler()(req('/'),{...env,ACCESS_AUD:''})).status,403);
});
test('save incomplete contract, enforce CSRF/body/unknown fields and preserve exact content; no publication side effects',async()=>{
 const a=blank();assert.ok(validate(a).length);assert.deepEqual(validateWorkingDraft(a),[]);
 assert.equal((await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a},{origin:'https://evil.test'})).status,403);
 assert.equal((await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a},{'x-csrf-token':'bad'})).status,403);
 assert.equal((await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:{...a,unexpected:'keep-or-reject'}})).status,422);
 const s=await data(await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a}));assert.equal(s.status,201);assert.deepEqual(s.article,a);
 const r=await call('/private/api/drafts/'+s.id);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('access-control-allow-origin'),null);
 assert.deepEqual((await r.json()).article,a);
 assert.equal((await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:{...a,title:'x'.repeat(560000)}})).status,413);
});
test('save/reopen/concurrent edits/recover history; duplicates reject and values survive export/import renderer',async()=>{
 const a=fixture();const saved=await data(await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a}));
 assert.equal(saved.status,201);
 assert.equal((await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a})).status,409);
 const change={id:saved.id,expectedRevision:1,expectedHash:saved.hash,article:{...a,title:'Edited private fixture'}};
 const results=await Promise.all([call('/private/api/drafts',change),call('/private/api/drafts',{...change,article:{...a,title:'Concurrent editor'}})]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const current=await data(await call('/private/api/drafts/'+saved.id));assert.equal(current.revision,2);
 const old=await data(await call('/private/api/drafts/'+saved.id+'/revisions/1'));assert.deepEqual(old.article,a);
 const restored=await data(await call('/private/api/drafts',{id:saved.id,expectedRevision:current.revision,expectedHash:current.hash,article:old.article}));
 assert.equal(restored.revision,3);assert.deepEqual(restored.article,a);assert.deepEqual(validate(restored.article),[]);
 assert.equal(article(restored.article,{preview:true}),article(a,{preview:true}));
 assert.deepEqual(updateEdition(a,JSON.parse(JSON.stringify(restored.article)),hash(a)),a);
 assert.equal((await call('/private/api/drafts',{id:saved.id,expectedRevision:3,expectedHash:restored.hash,article:{...a,id:'cu-weekly-2026-10-30'}})).status,409);
 const list=await data(await call('/private/api/drafts'));assert.ok(list.drafts.every(d=>!('content'in d)&&!('article'in d)));
});
test('private working copies of published articles preserve original publication metadata',async()=>{
 const a={...fixture(),id:'cu-weekly-2026-10-16',editionNumber:1,status:'published',publishedAt:'2026-10-23T17:00:00Z'};
 const s=await data(await call('/private/api/drafts',{id:null,expectedRevision:null,expectedHash:null,article:a}));
 assert.equal(s.status,201);
 assert.equal((await call('/private/api/drafts',{id:s.id,expectedRevision:s.revision,expectedHash:s.hash,article:{...a,publishedAt:'2026-10-24T17:00:00Z'}})).status,409);
});
test('retention thresholds, hourly short-data purge, daily content purge and failure reporting never remove articles/drafts',async()=>{
 const at=Date.parse('2026-11-30T03:00:00Z'),d=86400000,q=(s,...a)=>env.DB.prepare(s).bind(...a);
 await q("INSERT INTO articles(id,path,comments_enabled,reactions_enabled) VALUES('keep','/',1,1)").run();
 for(const [id,status,age]of [['old','pending',31],['new','spam',29],['approved','approved',100]]){
 await q('INSERT INTO comments(id,article_id,name,body,email,created_at,status,submission_key) VALUES(?,?,?,?,?,?,?,?)',id,'keep','Test','Private content','test@example.invalid',new Date(at-age*d).toISOString(),status,id).run();}
 await q('INSERT INTO reports VALUES(?,?,?)','approved','a'.repeat(64),new Date(at-23.5*3600000).toISOString()).run();
 await q('INSERT INTO limits VALUES(?,1,?)','short',Math.floor(at/1000)-1).run();
 await q('INSERT INTO audit VALUES(?,?,?,?,?)','old-audit','actor','test','id',new Date(at-91*d).toISOString()).run();
 await scheduled({cron:'0 * * * *',scheduledTime:at},env);
 assert.equal((await q("SELECT reporter FROM reports WHERE comment_id='approved'").first()).reporter.length,32);
 assert.ok(await q("SELECT id FROM comments WHERE id='old'").first());
 await cleanup(env,{full:true,at});
 assert.equal(await q("SELECT id FROM comments WHERE id='old'").first(),null);
 assert.ok(await q("SELECT id FROM comments WHERE id='new'").first());
 assert.equal((await q("SELECT email FROM comments WHERE id='approved'").first()).email,null);
 assert.ok(await q("SELECT id FROM articles WHERE id='keep'").first());
 assert.ok((await env.DRAFTS.prepare('SELECT COUNT(*) n FROM drafts').first()).n>0);
 assert.equal((await q('SELECT COUNT(*) n FROM audit').first()).n,0);
 assert.equal((await q("SELECT failed FROM retention_health WHERE kind='daily'").first()).failed,0);
 await assert.rejects(cleanup({...env,DB:{prepare:s=>env.DB.prepare(s),batch:async()=>{throw Error('private secret content');}}},{full:true,at}),/Retention cleanup failed/);
 assert.equal((await q("SELECT failed FROM retention_health WHERE kind='daily'").first()).failed,1);
});


test('independent MFA requires the pinned live owner policy; absence of AMR alone never authorizes',async()=>{
 const e={...env,ACCESS_MFA_MODE:'access-independent',ACCESS_ACCOUNT_ID:'a'.repeat(32),ACCESS_APP_ID:'11111111-1111-1111-1111-111111111111',ACCESS_POLICY_ID:'owner-policy',ACCESS_GOOGLE_IDP_ID:'google-idp',ACCESS_POLICY_READ_TOKEN:'test-read-only'};
 const now=Math.floor(Date.now()/1000),p={type:'app',iat:now,exp:now+3600};
 const app={id:e.ACCESS_APP_ID,type:'self_hosted',domain:'admin.courtumpire.com',aud:e.ACCESS_AUD,updated_at:new Date((now-10)*1000).toISOString(),session_duration:'1h',mfa_config:{mfa_disabled:false,allowed_authenticators:['totp'],session_duration:'1h'},allowed_idps:['google-idp'],policies:[{id:'owner-policy',decision:'allow',exclude:[],include:[{email:{email:e.OWNER_EMAILS}}],require:[{login_method:{id:'google-idp'}}],updated_at:new Date((now-10)*1000).toISOString()}]};
 const response=a=>async(url,opts)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/'+e.ACCESS_ACCOUNT_ID+'/access/apps/'+e.ACCESS_APP_ID);assert.equal(opts.redirect,'manual');return Response.json({success:true,result:a});};
 assert.equal(await verifyIndependentMfa(p,e,response(app)),true);
 for(const change of [
  a=>a.mfa_config.mfa_disabled=true,
  a=>a.mfa_config.allowed_authenticators=['totp','email'],
  a=>a.policies[0].mfa_config={mfa_disabled:true},
  a=>a.policies.push({...a.policies[0],decision:'bypass'}),
  a=>a.policies[0].include=[{everyone:{}}],
  a=>a.policies[0].require=[],
  a=>a.allowed_idps.push('email-code'),
  a=>a.aud='other-app',
  a=>a.domain='other.example',
  a=>a.updated_at=new Date((now+1)*1000).toISOString()
 ]){const altered=structuredClone(app);change(altered);assert.equal(await verifyIndependentMfa(p,e,response(altered)),false);}
 for(const wrong of [{...p,type:'org'},{...p,exp:now+7200},{...p,iat:now+60}])assert.equal(await verifyIndependentMfa(wrong,e,response(app)),false);
 assert.equal(await verifyIndependentMfa(p,{...e,ACCESS_POLICY_READ_TOKEN:''},response(app)),false);
 assert.equal(await verifyIndependentMfa(p,e,async()=>new Response('',{status:503})),false);
 assert.equal(await verifyIndependentMfa(p,e,async()=>new Response('',{status:302,headers:{location:'https://untrusted.invalid'}})),false);
 assert.equal(await verifyIndependentMfa(p,e,async()=>{throw Error('network');}),false);
 const noAmr=await mint({type:'app',amr:undefined});

 const verify=(t,_keys,options)=>jwtVerify(t,testKeys,options);
 const guard=(claims,settings)=>verifyIndependentMfa(claims,settings,response(app));
 const request=req('/',null,{'cf-access-jwt-assertion':noAmr});
 assert.equal(await owner(request,e,verify,guard),'test-owner');
 await assert.rejects(owner(request,{...e,ACCESS_POLICY_READ_TOKEN:''},verify,guard));
 for(const t of ['forged',await mint({type:'app',amr:undefined,email:'other@example.invalid'}),await mint({type:'app',amr:undefined,email:'other@wynctec.com'}),await mint({type:'app',amr:undefined},'other-aud'),await mint({type:'app',amr:undefined},e.ACCESS_AUD,e.ACCESS_ISSUER,'-1s')]){
  let called=false;await assert.rejects(owner(req('/',null,{'cf-access-jwt-assertion':t}),e,verify,async()=>{called=true;return true;}));assert.equal(called,false);
 }
});

