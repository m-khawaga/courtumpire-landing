// A separate Node-only demonstration harness. NEVER a Worker entry or deployment artifact.
import http from 'node:http';
import {manageRehearsal} from './rehearsal.mjs';
import {csrf} from './src/auth.mjs';
import fs from 'node:fs';
import {Miniflare} from 'miniflare';
import {createHandler} from './src/worker.mjs';
import {fixture} from '../tests/weekly-fixture.mjs';
import {article} from '../weekly-core/render.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("Local DB harness")}}',compatibilityDate:'2026-08-06',d1Databases:['DB'],d1Persist:'.weekly-private/demo-db'});
const DB=await mf.getD1Database('DB');try{await DB.exec(fs.readFileSync('backend/migrations/0001_weekly.sql','utf8').replace(/\n/g,' '));}catch(e){if(!String(e).includes('already exists'))throw e;}
await DB.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
for(const name of fs.readdirSync('backend/migrations').filter(n=>n.endsWith('.sql')&&!n.startsWith('0001')).sort()){if(!await DB.prepare('SELECT name FROM local_migrations WHERE name=?').bind(name).first()){await DB.exec(fs.readFileSync('backend/migrations/'+name,'utf8').replace(/\n/g,' '));await DB.prepare('INSERT INTO local_migrations(name) VALUES(?)').bind(name).run();}}
const port=8797,origin=`http://127.0.0.1:${port}`,publicOrigin='http://127.0.0.1:4187';
const localSecretPath='.weekly-private/demo-signing-secret.txt';
if(!fs.existsSync(localSecretPath))fs.writeFileSync(localSecretPath,crypto.randomUUID()+crypto.randomUUID(),{flag:'wx'});
const env={DB,PUBLIC_ORIGIN:publicOrigin,ADMIN_ORIGIN:origin,SIGNING_SECRET:fs.readFileSync(localSecretPath,'utf8')};
const rehearsal=fs.existsSync('.weekly-private/rehearsal/active.json');
const a=fixture();await DB.prepare('INSERT OR IGNORE INTO articles(id,path,comments_enabled,reactions_enabled) VALUES(?,?,1,1)').bind(a.id,'/demo/engagement.html').run();
if(rehearsal){await manageRehearsal(DB,'seed');const draft=JSON.parse(fs.readFileSync('.weekly-private/rehearsal/article.json','utf8'));await DB.prepare('UPDATE articles SET title=? WHERE id=?').bind(draft.title,draft.id).run();
await DB.exec('CREATE TABLE IF NOT EXISTS local_comment_reaction_seed(comment_id TEXT PRIMARY KEY)');const samples=await DB.prepare("SELECT id FROM comments WHERE article_id=? AND status='approved' AND name IN ('Sample Rally Robin','Sample Baseline Bea','Sample Volley Val')").bind(draft.id).all();for(const c of samples.results){if(!await DB.prepare('SELECT comment_id FROM local_comment_reaction_seed WHERE comment_id=?').bind(c.id).first()){await DB.batch([DB.prepare('INSERT INTO local_comment_reaction_seed(comment_id) VALUES(?)').bind(c.id),...Array.from({length:3},(_,i)=>DB.prepare('INSERT OR IGNORE INTO comment_reactions(comment_id,browser_id,value,version,updated_at) VALUES(?,?,?,1,?)').bind(c.id,'fictional-local-sample-'+i,i<2?1:-1,new Date().toISOString()))]);}}}

const handler=createHandler({owner:async req=>{if(new URL(req.url).origin!==origin)throw Object.assign(Error('Forbidden'),{status:403});return 'local-demo-owner';},turnstile:async(_env,token)=>{if(token!=='local-fictional-demo')throw Object.assign(Error('Local demo token required'),{status:403});}});
const original=fs.readFileSync('.weekly-private/demo/index.html','utf8');fs.writeFileSync('.weekly-private/demo/engagement.html',original.replace(/<article class="weekly-article"[\s\S]*<\/article>/,article(a,{config:{apiOrigin:origin,turnstileSiteKey:'local-demo'}})).replace('<main class="container weekly-page"','<p class="weekly-preview">FICTIONAL LOCAL BACKEND DEMO — test authentication only</p><main class="container weekly-page"'));
// The local demo bypass is injected by this harness into the served copy only.
const server=http.createServer(async(req,res)=>{if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);return res.end();}const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);return res.end();}chunks.push(chunk);}const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,String(value));headers.set('cf-connecting-ip','127.0.0.1');const request=new Request(origin+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});let response;
if(req.url?.startsWith('/admin/api/rehearsal/')){try{const mode=req.url.split('/').at(-1);if(req.method==='GET'&&mode==='status')response=Response.json(await manageRehearsal(DB,'status'));else if(req.method==='POST'){await csrf(request,env,'local-demo-owner');const b=await request.json();if(b.confirm!==true)throw Error('Explicit local reset confirmation required');response=Response.json(await manageRehearsal(DB,mode));}else response=Response.json({error:'Method not allowed'},{status:405});}catch(e){response=Response.json({error:e.message},{status:e.status||400});}response.headers.set('cache-control','private, no-store');}else response=await handler(request,env);let data=await response.text();if(req.url==='/admin')data=data.replace('<h1>','<p class="demo-notice">Local demo · unpublished draft · fictional seeded activity · loopback test authentication.</p><h1>');res.writeHead(response.status,Object.fromEntries(response.headers));res.end(data);});
server.listen(port,'127.0.0.1',()=>console.log(`Local moderation: ${origin}/admin\nThis harness has test auth, isolated local D1 and fictional data only.`));
async function close(){server.close();await mf.dispose();process.exit(0);}process.on('SIGINT',close);process.on('SIGTERM',close);
