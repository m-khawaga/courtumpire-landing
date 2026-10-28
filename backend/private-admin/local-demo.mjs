// Node-only demo; never imported by entry.mjs.
import fs from 'node:fs';
import http from 'node:http';
import {Miniflare} from 'miniflare';
import assets from './assets.generated.mjs';
import {createPrivateHandler} from './worker.mjs';
const port=8798,origin='http://127.0.0.1:'+port;
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local only")}}',compatibilityDate:'2026-08-06',d1Databases:['DRAFTS'],d1Persist:'.weekly-private/private-editor-db'});
const DRAFTS=await mf.getD1Database('DRAFTS');
await DRAFTS.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
if(!await DRAFTS.prepare('SELECT name FROM local_migrations WHERE name=?').bind('drafts-v1').first()){
 await DRAFTS.exec(fs.readFileSync('backend/private-admin/migrations/0001_drafts.sql','utf8').replace(/\n/g,' '));
 await DRAFTS.prepare('INSERT INTO local_migrations VALUES(?)').bind('drafts-v1').run();
}
const localAssets=structuredClone(assets);
localAssets['/authoring/index.html'].body=localAssets['/authoring/index.html'].body.replace('<main','<p class="weekly-preview">LOCAL DEMONSTRATION — loopback test identity, not Google/Access authentication. No cloud storage.</p><main');
const env={DRAFTS,PRIVATE_ASSETS:localAssets,ADMIN_ORIGIN:origin,OWNER_EMAILS:'info@wynctec.com (LOCAL TEST IDENTITY)',SIGNING_SECRET:crypto.randomUUID()+crypto.randomUUID(),WEEKLY:{fetch:r=>{const headers=new Headers(r.headers);if(headers.has('origin'))headers.set('origin','http://127.0.0.1:8797');return fetch(new Request('http://127.0.0.1:8797'+new URL(r.url).pathname+new URL(r.url).search,{method:r.method,headers,...(!['GET','HEAD'].includes(r.method)?{body:r.body,duplex:'half'}:{})}));}}};
const handle=createPrivateHandler({owner:async r=>{if(new URL(r.url).origin!==origin)throw Object.assign(Error('Wrong host'),{status:403});return 'local-private-demo-owner';}});
const server=http.createServer(async(req,res)=>{
 if(req.headers.host!=='127.0.0.1:'+port){res.writeHead(403);return res.end();}
 let n=0;const parts=[];for await(const p of req){n+=p.length;if(n>550000){res.writeHead(413);return res.end();}parts.push(p);}
 const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,String(v));
 const r=await handle(new Request(origin+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})}),env);
 res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
});
server.listen(port,'127.0.0.1',()=>console.log('Local private editor demo: '+origin));
async function close(){server.close();await mf.dispose();process.exit(0);}process.on('SIGINT',close);process.on('SIGTERM',close);

