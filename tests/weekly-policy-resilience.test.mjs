import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyIndependentMfa} from '../backend/src/access-policy.mjs';
import {owner} from '../backend/src/auth.mjs';
import {createPrivateHandler} from '../backend/private-admin/worker.mjs';
import {createHandler} from '../backend/src/worker.mjs';

function fixture(){
 const now=Math.floor(Date.now()/1000);
 const env={ADMIN_ORIGIN:'https://admin.courtumpire.com',ACCESS_ISSUER:'https://courtumpire.cloudflareaccess.com',ACCESS_AUD:'dummy-audience',OWNER_EMAILS:'owner@example.invalid',REQUIRE_ACCESS_MFA:'true',ACCESS_MFA_MODE:'access-independent',ACCESS_ACCOUNT_ID:'a'.repeat(32),ACCESS_APP_ID:'11111111-1111-1111-1111-111111111111',ACCESS_POLICY_ID:'dummy-policy',ACCESS_GOOGLE_IDP_ID:'dummy-google',ACCESS_POLICY_READ_TOKEN:'dummy-read-token'};
 const payload={type:'app',email:env.OWNER_EMAILS,sub:'dummy-owner',iat:now-1,exp:now+3600-1};
 const app={id:env.ACCESS_APP_ID,type:'self_hosted',domain:'admin.courtumpire.com',aud:env.ACCESS_AUD,updated_at:new Date((now-10)*1000).toISOString(),session_duration:'1h',mfa_config:{mfa_disabled:false,allowed_authenticators:['totp'],session_duration:'1h'},allowed_idps:[env.ACCESS_GOOGLE_IDP_ID],policies:[{id:env.ACCESS_POLICY_ID,decision:'allow',exclude:[],include:[{email:{email:env.OWNER_EMAILS}}],require:[{login_method:{id:env.ACCESS_GOOGLE_IDP_ID}}],updated_at:new Date((now-10)*1000).toISOString()}]};
 return {env,payload,app};
}
const good=app=>Response.json({success:true,result:app});
function fastBackoff(t){
 const delays=[];
 t.mock.method(globalThis,'setTimeout',(fn,ms)=>{delays.push(ms);queueMicrotask(fn);return 0;});
 return delays;
}
const timeout=()=>new DOMException('private upstream text must not be returned','TimeoutError');

test('healthy and slow in-deadline reads use one no-store GET and retain the five-second signal',async t=>{
 const {env,payload,app}=fixture();let time=Date.now(),calls=0;
 t.mock.method(Date,'now',()=>time);
 assert.equal(await verifyIndependentMfa(payload,env,async(url,options)=>{
  calls++;assert.equal(url,`https://api.cloudflare.com/client/v4/accounts/${env.ACCESS_ACCOUNT_ID}/access/apps/${env.ACCESS_APP_ID}`);
  assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.headers.authorization,'Bearer dummy-read-token');
  time+=4900;return good(app);
 }),true);assert.equal(calls,1);
});

test('transient failures receive exactly one bounded retry; successful response is fully checked',async t=>{
 const delays=fastBackoff(t),{env,payload,app}=fixture();
 for(const first of [()=>{throw timeout();},()=>{throw new TypeError('network');},... [502,503,504].map(status=>()=>new Response('',{status}))]){
  let calls=0;assert.equal(await verifyIndependentMfa(payload,env,async()=>++calls===1?first():good(app)),true);assert.equal(calls,2);
 }
 assert.equal(delays.length,5);assert.ok(delays.every(ms=>ms>=250&&ms<=500));
});

test('real stalled fetch hits the actual five-second abort, then one fresh read recovers',async()=>{
 const {env,payload,app}=fixture();let calls=0,aborted=false;
 const keepAlive=setTimeout(()=>{},7000),start=performance.now();
 try{
  assert.equal(await verifyIndependentMfa(payload,env,async(_url,{signal})=>{
   if(++calls===2)return good(app);
   return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}));
  }),true);
  assert.equal(calls,2);assert.equal(aborted,true);assert.ok(performance.now()-start>=5000);
 }finally{clearTimeout(keepAlive);}
});

test('persistent timeout, network outage and service unavailable deny after two reads',async t=>{
 fastBackoff(t);const {env,payload}=fixture();
 for(const failure of [()=>{throw timeout();},()=>{throw new TypeError('network');},()=>new Response('',{status:503})]){
  let calls=0;const reasons=[];
  assert.equal(await verifyIndependentMfa(payload,env,async()=>{calls++;return failure();},r=>reasons.push(r)),false);
  assert.equal(calls,2);assert.equal(reasons.length,1);assert.ok(!reasons[0].includes('private upstream'));
 }
});

test('a real two-attempt timeout outage stays bounded and never authorizes',async()=>{
 const {env,payload}=fixture();let calls=0,aborts=0;
 const keepAlive=setTimeout(()=>{},12000),start=performance.now();
 try{
  assert.equal(await verifyIndependentMfa(payload,env,async(_url,{signal})=>{
   calls++;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborts++;reject(signal.reason);},{once:true}));
  }),false);
  assert.equal(calls,2);assert.equal(aborts,2);
  // Allow scheduler overhead; the authorization deadline itself remains 10.5s.
  assert.ok(performance.now()-start>=10000);assert.ok(performance.now()-start<11500);
 }finally{clearTimeout(keepAlive);}
});

test('explicit denials, redirects, 429, retry-after and malformed data are never retried',async t=>{
 const delays=fastBackoff(t),{env,payload}=fixture();
 for(const response of [
  ...[301,302,400,401,403,404,429,500].map(status=>()=>new Response('',{status})),
  ()=>new Response('',{status:503,headers:{'retry-after':'60'}}),
  ()=>({ok:false,status:403,headers:new Headers(),body:{cancel:async()=>{throw new TypeError('stream closed');}}}),
  ()=>new Response('not JSON'),()=>Response.json({success:false}),()=>Response.json(null)
 ]){
  let calls=0;assert.equal(await verifyIndependentMfa(payload,env,async()=>{calls++;return response();}),false);assert.equal(calls,1);
 }
 assert.deepEqual(delays,[]);
});

test('revoked or changed policy after a timeout denies without a third attempt',async t=>{
 fastBackoff(t);const {env,payload,app}=fixture();
 for(const mutate of [
  a=>a.policies[0].decision='deny',a=>a.policies=[],a=>a.policies[0].include=[{email:{email:'other@example.invalid'}}],
  a=>a.mfa_config.mfa_disabled=true,a=>a.mfa_config.allowed_authenticators=['email'],
  a=>a.allowed_idps=['different'],a=>a.aud='different',a=>a.domain='different.invalid',
  a=>a.policies[0].updated_at=new Date((payload.iat+1)*1000).toISOString(),
  a=>a.updated_at=new Date((payload.iat+1)*1000).toISOString()
 ]){
  const changed=structuredClone(app);mutate(changed);let calls=0;
  assert.equal(await verifyIndependentMfa(payload,env,async()=>{if(++calls===1)throw timeout();return good(changed);}),false);
  assert.equal(calls,2);
 }
});

test('no policy cache: successful prior request cannot authorize during outage or revocation',async t=>{
 fastBackoff(t);const {env,payload,app}=fixture();let state='valid',calls=0;
 const fetcher=async()=>{calls++;if(state==='offline')throw timeout();const a=structuredClone(app);if(state==='revoked')a.policies[0].decision='deny';return good(a);};
 assert.equal(await verifyIndependentMfa(payload,env,fetcher),true);state='offline';
 assert.equal(await verifyIndependentMfa(payload,env,fetcher),false);state='revoked';
 assert.equal(await verifyIndependentMfa(payload,env,fetcher),false);assert.equal(calls,4);
});

test('late headers/body are discarded; valid-looking evidence cannot outlive the attempt deadline',async t=>{
 fastBackoff(t);const {env,payload,app}=fixture();let time=Date.now();t.mock.method(Date,'now',()=>time);
 for(const bodyDelayed of [false,true]){
  let calls=0;
  assert.equal(await verifyIndependentMfa(payload,env,async()=>{
   calls++;if(bodyDelayed)return {ok:true,json:async()=>{time+=5001;return {success:true,result:app};}};
   time+=5001;return good(app);
  }),false);assert.equal(calls,2);
 }
});

test('expiry during policy lookup or backoff and total-budget overruns deny',async t=>{
 fastBackoff(t);const {env,payload,app}=fixture();let time=Date.now();t.mock.method(Date,'now',()=>time);
 const nearExpiry={...payload,exp:Math.floor(time/1000)+1};
 assert.equal(await verifyIndependentMfa(nearExpiry,env,async()=>{time+=1100;return good(app);}),false);
 let calls=0;
 assert.equal(await verifyIndependentMfa({...payload,exp:Math.floor(time/1000)+4},env,async()=>{if(++calls===1){time+=4500;throw timeout();}return good(app);}),false);
 assert.equal(calls,1);
 calls=0;
 assert.equal(await verifyIndependentMfa(payload,env,async()=>{if(++calls===1){time+=10500;throw timeout();}return good(app);}),false);
 assert.equal(calls,1);
});

test('bad identity and JWT validation fail before any policy I/O',async()=>{
 const {env,payload}=fixture(),request=new Request(env.ADMIN_ORIGIN,{headers:{'cf-access-jwt-assertion':'dummy'}});let policyCalls=0;
 const policy=async()=>{policyCalls++;return true;};
 await assert.rejects(owner(request,env,async()=>({payload:{...payload,email:'wrong@example.invalid'}}),policy));
 await assert.rejects(owner(request,env,async()=>{throw Object.assign(Error('dummy'),{code:'ERR_JWT_EXPIRED'});},policy));
 assert.equal(policyCalls,0);
});

test('both private and Weekly handler boundaries deny outages without content or diagnostics',async t=>{
 fastBackoff(t);const {env,payload}=fixture();let protectedCalls=0;
 const auth=(req,e)=>owner(req,e,async()=>({payload}),
  (p,settings)=>verifyIndependentMfa(p,settings,async()=>{throw timeout();}));
 const privateEnv={...env,WEEKLY:{fetch:()=>{protectedCalls++;throw Error('must not forward');}},DRAFTS:{prepare:()=>{protectedCalls++;throw Error('must not read drafts');}}};
 for(const [handler,path]of [[createPrivateHandler({owner:auth}),'/admin'],[createPrivateHandler({owner:auth}),'/private/api/drafts'],[createHandler({owner:auth}),'/admin/api/retention-health']]){
  const r=await handler(new Request(env.ADMIN_ORIGIN+path,{headers:{'cf-access-jwt-assertion':'dummy'}}),privateEnv);
  assert.equal(r.status,403);assert.deepEqual(await r.json(),{error:'Authentication required.'});assert.match(r.headers.get('cache-control'),/no-store/);
 }
 assert.equal(protectedCalls,0);
});
