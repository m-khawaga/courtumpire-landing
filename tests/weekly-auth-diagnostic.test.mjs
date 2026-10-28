import test from 'node:test';
import assert from 'node:assert/strict';
import {authDiagnostic} from '../backend/src/auth-diagnostic.mjs';
import {createPrivateHandler} from '../backend/private-admin/worker.mjs';
import {createHandler} from '../backend/src/worker.mjs';
import {owner} from '../backend/src/auth.mjs';
import {verifyIndependentMfa} from '../backend/src/access-policy.mjs';
const origin='https://admin.courtumpire.com';
test('diagnostics reject arbitrary values and never include exception/identity content',()=>{
 for(const code of ['private@example.invalid','Bearer secret',null,{},'policy-api-503\nsecret','policy-unavailable-Error: secret'])assert.deepEqual(authDiagnostic({status:403,authCode:code},'weekly'),{});
 assert.deepEqual(authDiagnostic({status:403,authCode:'expired',token:'secret',email:'private@example.invalid',stack:'secret'},'weekly'),{diagnostic:{stage:'weekly',category:'expired'}});
 assert.deepEqual(authDiagnostic({status:500,authCode:'expired'},'weekly'),{});
});
test('both admin boundaries still deny while identifying only the sanitized failure category',async()=>{
 const denied=async()=>{throw Object.assign(Error('Authentication required.'),{status:403,authCode:'policy-unavailable-TimeoutError',token:'must not leak'});};
 for(const [handler,path,stage]of [[createPrivateHandler({owner:denied}),'/','private-editor'],[createHandler({owner:denied}),'/admin/api/retention-health','weekly']]){
  const r=await handler(new Request(origin+path),{});assert.equal(r.status,403);assert.match(r.headers.get('cache-control'),/no-store/);
  assert.deepEqual(await r.json(),{error:'Authentication required.',diagnostic:{stage,category:'policy-unavailable-TimeoutError'}});
 }
});
test('a policy-service timeout remains a denial and is distinct from invalid-owner rejection',async()=>{
 const env={ADMIN_ORIGIN:origin,ACCESS_ISSUER:'https://courtumpire.cloudflareaccess.com',ACCESS_AUD:'test',OWNER_EMAILS:'owner@example.invalid',REQUIRE_ACCESS_MFA:'true',ACCESS_MFA_MODE:'access-independent',ACCESS_ACCOUNT_ID:'a'.repeat(32),ACCESS_APP_ID:'11111111-1111-1111-1111-111111111111',ACCESS_POLICY_ID:'test',ACCESS_GOOGLE_IDP_ID:'test',ACCESS_POLICY_READ_TOKEN:'local dummy'};
 const now=Math.floor(Date.now()/1000),payload={email:env.OWNER_EMAILS,sub:'dummy',iat:now,exp:now+3600,type:'app'};
 const req=new Request(origin+'/admin',{headers:{'cf-access-jwt-assertion':'local dummy'}});
 const policy=(p,e,_fetch,report)=>verifyIndependentMfa(p,e,async()=>{throw new DOMException('Do not disclose this message','TimeoutError');},report);
 await assert.rejects(owner(req,env,async()=>({payload}),policy),e=>e.status===403&&e.authCode==='policy-unavailable-TimeoutError');
 await assert.rejects(owner(req,env,async()=>({payload:{...payload,email:'other@example.invalid'}}),policy),e=>e.status===403&&e.authCode==='owner-denied');
});
