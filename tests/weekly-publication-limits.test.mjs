import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {publicationLimit} from '../backend/src/publication-limits.mjs';
import {createHandler} from '../backend/src/worker.mjs';
import {signed,fail} from '../backend/src/auth.mjs';

function setup(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL); CREATE INDEX limits_expiry ON limits(expires);');
 const env={DIRECT_PUBLISHING:'true',ADMIN_ORIGIN:'https://admin.courtumpire.com',SIGNING_SECRET:'local-test-only-long-secret-for-rate-tests',DB:{
  prepare(sql){const stmt=db.prepare(sql);return {
   bind(...args){return {async first(){return stmt.get(...args)||null;},async run(){return stmt.run(...args);}};}
  };}
 }};
 return {db,env};
}
test('shared SQL throttles concurrent previews, resets at boundary, and stores no owner identity',async()=>{
 const {db,env}=setup(),actor='owner@example.test',time=1200001;
 try{
  const results=await Promise.allSettled(Array.from({length:25},()=>publicationLimit(env,actor,'/admin/api/publishing/preview',null,time)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,20);
  for(const r of results.filter(r=>r.status==='rejected'))assert.equal(r.reason.status,429);
  const rows=db.prepare('SELECT * FROM limits').all();assert.equal(rows.length,1);assert.equal(rows[0].count,21);assert.equal(rows[0].expires,1800);assert.ok(!JSON.stringify(rows).includes(actor));
  await publicationLimit(env,actor,'/admin/api/publishing/preview',null,1800000);
  assert.equal(db.prepare('SELECT count FROM limits').get().count,1);
 }finally{db.close();}
});
test('write throttling leaves outcome checks and separate withdrawal budget available; outages fail closed',async()=>{
 const {db,env}=setup();try{
  for(let i=0;i<30;i++)await publicationLimit(env,'owner','/admin/api/publishing/mutate','update',1200001);
  await assert.rejects(publicationLimit(env,'owner','/admin/api/publishing/mutate','publish',1200001),e=>e.status===429);
  await publicationLimit(env,'owner','/admin/api/publishing/mutate','unpublish',1200001);
  await publicationLimit(env,'owner','/admin/api/publishing/operation',null,1200001);
  for(let i=0;i<6;i++)await publicationLimit(env,'owner','/admin/api/publishing/export',null,1200001);
  await assert.rejects(publicationLimit(env,'owner','/admin/api/publishing/export',null,1200001),e=>e.status===429);
  await assert.rejects(publicationLimit({...env,DB:{prepare(){throw Error('unavailable');}}},'owner','/admin/api/publishing/preview'));
 }finally{db.close();}
});
test('HTTP entry authenticates and checks CSRF before consuming the publishing budget',async()=>{
 const {db,env}=setup(),actor='owner@example.test';try{
  const request=csrf=>new Request(env.ADMIN_ORIGIN+'/admin/api/publishing/preview',{method:'POST',headers:{origin:env.ADMIN_ORIGIN,'content-type':'application/json','x-csrf-token':csrf||''},body:'{}'});
  const rejected=createHandler({owner:()=>fail(403,'Authentication required.')});
  assert.equal((await rejected(request(),env)).status,403);
  const owner=createHandler({owner:()=>actor});assert.equal((await owner(request(),env)).status,403);
  assert.equal(db.prepare('SELECT count(*) n FROM limits').get().n,0);
  const csrf=await signed(env,{purpose:'csrf'},actor,900);
  // Publishing state is deliberately absent: authenticated work fails closed,
  // but only after the distributed throttle has consumed one attempt.
  assert.equal((await owner(request(csrf),env)).status,503);
  assert.equal(db.prepare('SELECT count FROM limits').get().count,1);
 }finally{db.close();}
});
