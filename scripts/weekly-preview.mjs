import {loadEditions,published} from '../weekly-core/store.mjs';
import {snapshot} from '../weekly-core/rankings.mjs';
import {readHistory} from '../weekly-core/ranking-store.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.WEEKLY_PORT||4187),origin=`http://127.0.0.1:${port}`;
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.mp4':'video/mp4','.vtt':'text/vtt'};
const allowed=/^\/(?:authoring\/(?:index\.html|editor\.mjs|schema\.json|template\.json)|weekly-core\/(?:contract|render|rankings|ranking-import|presentation|results)\.mjs)$/;
export const server=http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.headers.host!==`127.0.0.1:${server.address().port}`||req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){res.writeHead(403);return res.end('Origin or host rejected');}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Read-only preview');}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,origin).pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname.endsWith('/'))pathname+='index.html';
  if(pathname==='/authoring/ranking-context.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({snapshots:published(loadEditions()).map(snapshot),history:readHistory()}));}
  const rehearsalFiles={'/rehearsal/index.html':'home.html','/rehearsal/weekly/index.html':'archive.html','/rehearsal/article/index.html':'reader.html','/rehearsal/article.json':'article.json','/rehearsal/downloads/CourtUmpire_Weekly_ChatGPT_Prompt.txt':'downloads/CourtUmpire_Weekly_ChatGPT_Prompt.txt','/rehearsal/downloads/cu-weekly-2026-10-23-corrected.json':'downloads/cu-weekly-2026-10-23-corrected.json'};
  let file;if(/^\/rehearsal\/review\/(?:index\.html|overview\.png|after-(?:results|turning|rankings|editor|moderation)-(?:390|768|1440)\.png)$/.test(pathname))file=path.join(root,'.weekly-private/correction-pass',path.basename(pathname));else if(rehearsalFiles[pathname])file=path.join(root,'.weekly-private/rehearsal',rehearsalFiles[pathname]);else if(pathname.startsWith('/demo/')&&/^\/demo\/(index\.html|fixture\.json|social\.svg|engagement\.html)$/.test(pathname))file=path.join(root,'.weekly-private',pathname.slice(1));else if(allowed.test(pathname))file=path.join(root,pathname.slice(1));else file=path.join(root,'dist',pathname.slice(1));
  if(pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.'))||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');if(pathname.startsWith('/rehearsal/'))res.setHeader('X-Robots-Tag','noindex, nofollow');if(pathname.startsWith('/rehearsal/downloads/'))res.setHeader('Content-Disposition','attachment; filename="'+path.basename(file)+'"');let data=fs.readFileSync(file);
  const rehearsalActive=fs.existsSync('.weekly-private/rehearsal/active.json');
  if(rehearsalActive&&pathname==='/authoring/index.html')data=Buffer.from(data.toString().replace('Load fictional example','Load rehearsal article'));
  if(rehearsalActive&&pathname==='/authoring/editor.mjs')data=Buffer.from(data.toString().replace("load('/demo/fixture.json')","load('/rehearsal/article.json')"));
  if(rehearsalActive&&pathname==='/weekly/engagement.mjs'){const version=fs.existsSync('.weekly-private/rehearsal/generation.txt')?fs.readFileSync('.weekly-private/rehearsal/generation.txt','utf8').trim():'1';data=Buffer.from(data.toString().replace('courtumpire.weekly.reaction.','courtumpire.weekly.rehearsal.'+version+'.reaction.'));}
if(pathname==='/weekly/engagement.mjs')data=Buffer.from(data.toString().replace("if(!sitekey)","if(sitekey==='local-demo' && location.hostname==='127.0.0.1'){container.textContent='LOCAL DEMO: simulated anti-abuse check, no third-party request.';return 'local-fictional-demo';} if(!sitekey)"));res.end(req.method==='HEAD'?undefined:data);
});
server.listen(port,'127.0.0.1',()=>console.log(`Weekly local preview: ${origin}/weekly/\nFictional edition: ${origin}/demo/\nPrivate editor: ${origin}/authoring/`));

