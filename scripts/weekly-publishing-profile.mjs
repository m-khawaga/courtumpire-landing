// Local-only profiling. No remote I/O or real credentials. Reports contain
// timings/sizes/hashes; separate SQL fixture seeds stay in ignored .weekly-private.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Session} from 'node:inspector';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {crc32} from 'node:zlib';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT,jwtVerify} from 'jose';
import {Resvg} from '@resvg/resvg-js';
import {owner,csrf,signed} from '../backend/src/auth.mjs';
import {verifyIndependentMfa} from '../backend/src/access-policy.mjs';

const [input,output,multiplier='1']=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/weekly-publishing-profile.mjs PRIVATE_INPUT PRIVATE_REPORT_PREFIX [results multiplier]');
const privateRoot=path.resolve('.weekly-private')+path.sep;
if(!path.resolve(output).startsWith(privateRoot))throw Error('Reports and private SQL seeds must stay inside .weekly-private.');
const moduleAt=p=>import(pathToFileURL(path.resolve(process.env.PROFILE_SOURCE||'.',p)).href);
const {validate}=await moduleAt('weekly-core/contract.mjs');
const {snapshot,rankingErrors}=await moduleAt('weekly-core/rankings.mjs');
const {article,social}=await moduleAt('weekly-core/render.mjs');
const {entityNames,emphasize,createEmphasizer,friendlyDate}=await moduleAt('weekly-core/presentation.mjs');
const {publishingApi}=await moduleAt('backend/src/publication.mjs');
const coldFirst=process.env.PROFILE_COLD_FIRST||'preview';assert.ok(['preview','publish','update'].includes(coldFirst));
const a=JSON.parse(fs.readFileSync(input,'utf8'));
if(a.status!=='draft')throw Error('Use a private draft input.');
const m=Number(multiplier);assert.ok(Number.isSafeInteger(m)&&m>=1&&m<=5);
if(m>1){
 const t=a.sections.flatMap(s=>s.tables).find(t=>t.id==='weekly-singles');assert.ok(t);
 const original=structuredClone(t.rows);
 for(let i=1;i<m;i++)for(const row of original){const r=structuredClone(row);r.cells.opponent+=' — synthetic performance fixture '+i;t.rows.push(r);}
 const ledger=a.sections.flatMap(s=>s.tables).find(t=>t.id==='results-coverage');
 for(const r of ledger.rows)r.cells['verified-count']=String(Number(r.cells['verified-count'])*m);
 a.title='PRIVATE SYNTHETIC PERFORMANCE FIXTURE';
}
assert.deepEqual(validate(a),[]);assert.deepEqual(rankingErrors(a,null),[]);
const metrics={};
async function measure(name,fn){const c=process.cpuUsage(),w=performance.now();const result=await fn();const cpu=process.cpuUsage(c);(metrics[name]??=[]).push({wallMs:performance.now()-w,cpuMs:(cpu.user+cpu.system)/1000});return result;}
const hash=s=>createHash('sha256').update(s).digest('hex');
const report={warning:'Node process CPU, not Workers CPU. Windows CPU samples have coarse ~15 ms granularity; zero does not mean zero work. Local SQLite and fixture policy/JWKS transport; no network latency included. Cold = first operation in this fresh process, not isolate startup; other first samples can share warm components.',firstOperation:coldFirst,results:a.sections.flatMap(s=>s.tables).filter(t=>t.variant==='results').reduce((n,t)=>n+t.rows.length,0),inputBytes:Buffer.byteLength(JSON.stringify(a)),metrics};
// Real SQL/migrations/transactions, with the same D1 interface; transport is local.
function database(){const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('backend/migrations').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('backend/migrations/'+f,'utf8'));
 const prepare=sql=>{let values=[];return {bind(...args){values=args;return this;},async first(){return db.prepare(sql).get(...values)??null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){const r=db.prepare(sql).run(...values);return {success:true,meta:{changes:r.changes}};}};};
 return {prepare,seed(row){db.prepare('INSERT INTO editions VALUES('+Object.values(row).map(()=>'?').join(',')+')').run(...Object.values(row));db.prepare('INSERT INTO edition_slugs VALUES(?,?)').run(row.slug,row.id);db.exec('UPDATE publishing_state SET version=1,next_edition=2');},async batch(items){db.exec('BEGIN');try{const out=[];for(const item of items)out.push(await item.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}},close:()=>db.close()};}
const origin='https://admin.courtumpire.com';
const env={ADMIN_ORIGIN:origin,ACCESS_ISSUER:'https://profile.cloudflareaccess.com',ACCESS_AUD:'profile-audience',OWNER_EMAILS:'owner@example.invalid',REQUIRE_ACCESS_MFA:'true',ACCESS_MFA_MODE:'access-independent',ACCESS_ACCOUNT_ID:'a'.repeat(32),ACCESS_APP_ID:'a'.repeat(36),ACCESS_POLICY_ID:'fixture-policy',ACCESS_GOOGLE_IDP_ID:'fixture-google',ACCESS_POLICY_READ_TOKEN:'fixture-not-a-secret',SIGNING_SECRET:'local-profile-only-signing-secret-00000',PUBLISHING_WRITES_OPEN:'true'};
const policy={success:true,result:{id:env.ACCESS_APP_ID,type:'self_hosted',aud:env.ACCESS_AUD,domain:'admin.courtumpire.com',mfa_config:{mfa_disabled:false,allowed_authenticators:['totp'],session_duration:'1h'},session_duration:'1h',allowed_idps:[env.ACCESS_GOOGLE_IDP_ID],updated_at:'2020-01-01T00:00:00Z',policies:[{id:env.ACCESS_POLICY_ID,decision:'allow',exclude:[],include:[{email:{email:env.OWNER_EMAILS}}],require:[{login_method:{id:env.ACCESS_GOOGLE_IDP_ID}}],updated_at:'2020-01-01T00:00:00Z'}]}};
const pair=await generateKeyPair('RS256'),jwk=await exportJWK(pair.publicKey);jwk.kid='profile';
const jwks=createLocalJWKSet({keys:[jwk]});
const token=await new SignJWT({email:env.OWNER_EMAILS,type:'app'}).setProtectedHeader({alg:'RS256',kid:jwk.kid}).setSubject('profile-owner').setIssuedAt().setIssuer(env.ACCESS_ISSUER).setAudience(env.ACCESS_AUD).setExpirationTime('30m').sign(pair.privateKey);
const csrfToken=await signed(env,{purpose:'csrf'},'profile-owner',1800);
const authRequest=()=>new Request(origin+'/admin/api/publishing/preview',{method:'POST',headers:{origin,'cf-access-jwt-assertion':token,'x-csrf-token':csrfToken}});
const authenticate=()=>owner(authRequest(),env,(t,_remote,options)=>jwtVerify(t,jwks,options),(p,e)=>verifyIndependentMfa(p,e,async()=>Response.json(policy)));
// Server cover ingestion; rasterization below is native local test setup, not the browser canvas or Worker.
let png=new Resvg(social(a)).render().asPng();
if(process.env.PROFILE_LARGE_COVER){
 // Valid PNG ancillary text chunk; exercise the existing ~240 KB input bound.
 const data=Buffer.from('profile\0'+'x'.repeat(179940-png.length-20));
 const type=Buffer.from('tEXt'),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
 png=Buffer.concat([png.subarray(0,-12),length,type,data,crc,png.subarray(-12)]);
}
const cover='data:image/png;base64,'+png.toString('base64');
report.coverBytes=cover.length;
const session=new Session();session.connect();const post=promisify(session.post.bind(session));if(process.env.PROFILE_SAMPLES){await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:100});await post('Profiler.start');}
for(let run=0;run<6;run++){
 const db=database();env.DB=db;
 const call=async(path,body)=>{const actor=await measure('authentication',authenticate);await measure('csrf',()=>csrf(authRequest(),env,actor));const parsed=await measure('request-parse',()=>JSON.parse(JSON.stringify(body)));const response=await publishingApi(new Request(origin+'/admin/api/publishing/'+path,{method:'POST'}),env,parsed);assert.equal(response.status,200);return response.json();};
 const body={key:crypto.randomUUID(),action:'publish',article:a,expectedVersion:0,expectedRevision:null,expectedHash:null,confirmId:a.id,cover};
 if(run!==0||coldFirst==='preview')await measure('preview-total',()=>call('preview',body));
 let published;
 if(run===0&&coldFirst==='update'){const seed=JSON.parse(fs.readFileSync(process.env.PROFILE_SEED,'utf8'));db.seed(seed);published={revision:seed.revision,hash:seed.hash};}
 else {published=await measure('publish-total',()=>call('mutate',body));if(run===0)fs.writeFileSync(output+'.private-seed.json',JSON.stringify(await db.prepare('SELECT * FROM editions WHERE id=?').bind(a.id).first()));}
 const row=await db.prepare('SELECT content FROM editions WHERE id=?').bind(a.id).first();const current=JSON.parse(row.content);current.deck+=' Local performance update.';
 await measure('update-total',()=>call('mutate',{...body,key:crypto.randomUUID(),action:'update',article:current,expectedVersion:1,expectedRevision:published.revision,expectedHash:published.hash}));
 assert.equal((await db.prepare('SELECT count(*) n FROM edition_revisions').first()).n,2);db.close();
}
const p=structuredClone(a);p.status='published';p.editionNumber=1;p.publishedAt='2026-10-29T10:00:00Z';
for(let run=0;run<10;run++){
 await measure('validation',()=>assert.deepEqual(validate(p),[]));
 await measure('ranking-checks',()=>assert.deepEqual(rankingErrors(p,null),[]));
 await measure('ranking-snapshot',()=>snapshot(p));
 const html=await measure('render-once',()=>article(p,{comparison:null}));report.htmlBytes=Buffer.byteLength(html);report.htmlHash=hash(html);
 await measure('serialization',()=>JSON.stringify({article:p,html,comparison:null}));
 const names=await measure('entity-names',()=>entityNames(p));
 await measure('paragraph-emphasis',()=>{const highlight=createEmphasizer?createEmphasizer(names):(t,seen)=>emphasize(t,names,seen);for(const s of p.sections){const seen=new Set();for(const v of s.paragraphs)highlight(v.text,seen);}});
 await measure('date-formatting-206',()=>{for(let i=0;i<206;i++)friendlyDate('2026-10-20');});
 await measure('cover-check-decode',()=>{assert.match(cover,/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/);const b=Uint8Array.from(atob(cover.split(',')[1]),c=>c.charCodeAt(0));assert.equal(new DataView(b.buffer).getUint32(16),1200);});
}
if(process.env.PROFILE_SAMPLES){const {profile}=await post('Profiler.stop');fs.writeFileSync(output+'.cpuprofile',JSON.stringify(profile));}session.disconnect();
const statistics=v=>{const sorted=v.slice(1).sort((a,b)=>a-b);return {cold:v[0],median:sorted[Math.floor(sorted.length/2)],max:Math.max(...sorted)};};
report.summary=Object.fromEntries(Object.entries(metrics).map(([name,rows])=>[name,{wallMs:statistics(rows.map(r=>r.wallMs)),cpuMs:statistics(rows.map(r=>r.cpuMs))}]));
fs.writeFileSync(output+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({results:report.results,inputBytes:report.inputBytes,htmlBytes:report.htmlBytes,summary:report.summary},null,2));
