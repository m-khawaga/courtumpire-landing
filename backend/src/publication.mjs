import {validate} from '../../weekly-core/contract.mjs';
import {snapshot,rankingErrors} from '../../weekly-core/rankings.mjs';
import {article,esc,editionPath,metadata,archive,readingTime,social} from '../../weekly-core/render.mjs';
import {fail} from './auth.mjs';
const q=(env,s,...args)=>env.DB.prepare(s).bind(...args);
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json','cache-control':'private, no-store'}});
const validId=id=>typeof id==='string'&&/^cu-weekly-\d{4}-\d{2}-\d{2}$/.test(id);
const record=r=>r?{id:r.id,revision:r.revision,hash:r.hash,status:r.status,article:JSON.parse(r.content),comparison:JSON.parse(r.comparison)}:null;
const state=env=>q(env,'SELECT version,next_edition FROM publishing_state WHERE id=1').first();
const edition=(env,id)=>q(env,'SELECT * FROM editions WHERE id=?',id).first();
const summary=r=>JSON.parse(r.content);
const config=env=>({apiOrigin:env.API_ORIGIN||'https://weekly-api.courtumpire.com',turnstileSiteKey:env.TURNSTILE_SITE_KEY||'0x4AAAAAAFp6hX5OSlqZVaAA'});
// No edge/browser cache of dynamic publication state: unpublish takes effect on the
// next primary D1 read. Previously downloaded copies cannot be recalled.
export function page(env,title,description,path,body,extra=''){
 const canonical='https://courtumpire.com'+path;
 const shell=env.PUBLIC_SHELL||'<html><head><title>__TITLE__</title>__HEAD__</head><body><main>__BODY__</main></body></html>';
 return shell.replace('__TITLE__',esc(title)+' | CourtUmpire').replace('__HEAD__',`<link rel="canonical" href="${esc(canonical)}"><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta name="twitter:card" content="summary_large_image">${extra}`).replace('__BODY__',body);
}
function invalid(errors){const e=Object.assign(Error('Resolve validation errors before publication.'),{status:422,errors});throw e;}
function checkArticle(a,comparison){const errors=validate(a);if(errors.length)invalid(errors);const ranking=rankingErrors(a,comparison);if(ranking.length)invalid(ranking);}
async function prepare(env,b,{preview=false}={}){
 const s=await state(env);if(!s)fail(503,'Publishing migration is required.');
 if(b.expectedVersion!==s.version)fail(409,'Publication state changed. Refresh and preview again.');
 if(!validId(b.article?.id))fail(400,'Valid edition ID required.');
 const old=await edition(env,b.article.id);
 if(old?(b.expectedRevision!==old.revision||b.expectedHash!==old.hash):(b.expectedRevision!==null||b.expectedHash!==null))fail(409,'Published revision changed. Reopen the edition before editing.');
 if(old&&['trash','deleted'].includes(old.status))fail(409,'Restore from Trash before editing. Permanently deleted IDs cannot be reused.');
 const a=structuredClone(b.article),at=new Date().toISOString();
 let comparison=null;
 if(old){const original=JSON.parse(old.content);for(const k of ['id','editionNumber','publishedAt','issueDate','updatedAt'])if(a[k]!==original[k])fail(409,'Original publication metadata cannot change.');
  if(!Array.isArray(a.corrections))invalid([{path:'corrections',message:'Required array.'}]);
  if(original.corrections.some(c=>!a.corrections.some(n=>JSON.stringify(n)===JSON.stringify(c))))fail(409,'Preserve existing correction notes.');
  if(old.status==='published'&&JSON.stringify({...a,updatedAt:original.updatedAt})===JSON.stringify(original))fail(409,'No content changes to publish.');
  comparison=JSON.parse(old.comparison);a.updatedAt=at;
 }else{
  if(a.status!=='draft'||a.publishedAt!==null||a.editionNumber!==null||a.updatedAt!==null)fail(400,'First publication requires a draft with unassigned publication metadata.');
  const prior=await q(env,"SELECT snapshot FROM editions WHERE status='published' ORDER BY edition_number DESC LIMIT 1").first();comparison=prior?JSON.parse(prior.snapshot):null;
  a.editionNumber=s.next_edition;a.publishedAt=at;a.updatedAt=null;
 }
 a.status='published';checkArticle(a,comparison);
 if(Date.parse(a.coverageEnd)>Date.now()||Date.parse(a.factsCheckedAt)>Date.now()||a.sources.some(x=>Date.parse(x.accessedAt)>Date.now()))fail(422,'Future facts or retrieval timestamps cannot be published.');
 const alias=await q(env,'SELECT edition_id FROM edition_slugs WHERE slug=?',a.slug).first();if(alias&&alias.edition_id!==a.id)fail(409,'Slug belongs to another edition, including its historical URLs.');
 const content=JSON.stringify(a);if(new TextEncoder().encode(content).length>500000)fail(413,'Article exceeds 500 KB.');
 // Preview uses the same validated renderer once. Hash/snapshot are storage work;
 // publish/update still recompute and validate everything before the transaction.
 const rendered=article(a,{preview,comparison,...(preview?{}:{config:config(env)})});if(new TextEncoder().encode(rendered).length>1100000)fail(413,'Rendered edition exceeds 1.1 MB. Reduce the edition size.');
 return {s,old,a,at,comparison,content,rendered,...(preview?{}:{hash:await sha(content),snapshot:JSON.stringify(snapshot(a))})};
}
function cover(value){
 if(typeof value!=='string'||value.length>240000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value))fail(422,'A generated PNG cover is required. Preview again.');
 const bytes=Uint8Array.from(atob(value.split(',')[1]),c=>c.charCodeAt(0));const d=new DataView(bytes.buffer);
 if(bytes.length<33||[137,80,78,71,13,10,26,10].some((b,i)=>bytes[i]!==b)||d.getUint32(16)!==1200||d.getUint32(20)!==630)fail(422,'Cover must be a 1200 × 630 PNG.');
 return value;
}
async function resultFor(env,id,fingerprint){const row=await q(env,'SELECT fingerprint,result FROM publication_operations WHERE id=?',id).first();if(!row)return null;if(row.fingerprint!==fingerprint)fail(409,'Operation ID was already used for different content.');return JSON.parse(row.result);}
export async function publishingApi(request,env,body){
 if(!['GET','POST'].includes(request.method))fail(405,'Method not allowed.');
 const url=new URL(request.url),base='/admin/api/publishing',path=url.pathname.slice(base.length),id=url.searchParams.get('id');
 if(request.method==='GET'){
  if(path==='/state'){const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail(400,'Invalid page.');const rows=(await q(env,'SELECT id,slug,status,revision,hash,edition_number,published_at,changed_at,json_extract(content,\'$.title\') AS title FROM editions WHERE status<>\'deleted\' ORDER BY edition_number DESC LIMIT 21 OFFSET ?',offset).all()).results;return json({...await state(env),publicationOpen:env.PUBLISHING_WRITES_OPEN==='true',editions:rows.slice(0,20),next:rows.length>20?offset+20:null});}
  if(path==='/operation'){const row=await q(env,'SELECT result FROM publication_operations WHERE id=?',url.searchParams.get('key')||'').first();return row?json(JSON.parse(row.result)):json({error:'No committed outcome found. It may still be running; do not start a new operation.'},404);}
  if(path==='/ranking-context'){const latest=await q(env,"SELECT snapshot FROM editions WHERE status='published' ORDER BY edition_number DESC LIMIT 1").first();const current=validId(id)?await edition(env,id):null;const history={snapshots:{},comparisons:{}};if(current&&current.status!=='deleted'){const c=JSON.parse(current.comparison);history.comparisons[id]=c?id+'-baseline':null;if(c)history.snapshots[id+'-baseline']=c;}return json({snapshots:latest?[JSON.parse(latest.snapshot)]:[],history});}
  if(!validId(id))fail(400,'Edition ID required.');
  if(path==='/edition'){const row=await edition(env,id);if(!row||row.status==='deleted')fail(404,'Edition not found.');return json(record(row));}
  if(path==='/history'){const before=Number(url.searchParams.get('before')||2147483647);if(!Number.isSafeInteger(before)||before<1)fail(400,'Invalid revision cursor.');const rows=(await q(env,'SELECT revision,hash,status,changed_at FROM edition_revisions WHERE edition_id=? AND revision<? ORDER BY revision DESC LIMIT 21',id,before).all()).results;return json({revisions:rows.slice(0,20),next:rows.length>20?rows[19].revision:null});}
  if(path==='/revision'){const row=await q(env,'SELECT * FROM edition_revisions WHERE edition_id=? AND revision=?',id,Number(url.searchParams.get('revision'))).first();if(!row)fail(404,'Revision not found.');return json(record({...row,id}));}
  if(path==='/export'){const row=await edition(env,id);if(!row)fail(404,'Edition not found.');const total=await q(env,'SELECT count(*) n,COALESCE(sum(length(content)+length(cover)+length(snapshot)+length(comparison)),0) bytes FROM edition_revisions WHERE edition_id=?',id).first();if(total.n>500||total.bytes>12000000)fail(413,'History exceeds browser export limit. Use a protected full D1 backup.');const revisions=(await q(env,'SELECT content,snapshot,comparison,status,revision,hash,cover,changed_at FROM edition_revisions WHERE edition_id=? ORDER BY revision',id).all()).results;return json({format:'courtumpire-published-backup/v1',exportedAt:new Date().toISOString(),edition:record(row),revisions,slugs:(await q(env,'SELECT slug FROM edition_slugs WHERE edition_id=?',id).all()).results.map(r=>r.slug)});}
  fail(404,'Not found.');
 }
 if(path==='/preview'){const p=await prepare(env,body,{preview:true});return json({article:p.a,html:page(env,p.a.title,p.a.seoDescription,editionPath(p.a),p.rendered),comparison:p.comparison,version:p.s.version});}
 if(path!=='/mutate')fail(404,'Not found.');
 const b=body;if(!b||Object.keys(b).some(k=>!['key','action','article','id','expectedRevision','expectedHash','expectedVersion','confirmId','cover'].includes(k)))fail(400,'Unknown publication field.');
 if(!/^[0-9a-f-]{36}$/.test(b.key||'')||!['publish','update','unpublish','trash','restore','purge'].includes(b.action))fail(400,'Valid operation key and action required.');
 const fingerprint=await sha(JSON.stringify(b)),retry=await resultFor(env,b.key,fingerprint);if(retry)return json(retry);
 if(['publish','update'].includes(b.action)&&env.PUBLISHING_WRITES_OPEN!=='true')fail(503,'Publication is paused until activation checks pass. Your private working copy is unchanged.');
 let p;
 if(['unpublish','trash','restore','purge'].includes(b.action)){
  const s=await state(env),old=await edition(env,b.id);if(!old||s.version!==b.expectedVersion||old.revision!==b.expectedRevision||old.hash!==b.expectedHash)fail(409,'Edition changed. Reopen it.');
  if(old.status==='deleted'||b.action==='unpublish'&&old.status!=='published'||['restore','purge'].includes(b.action)&&old.status!=='trash'||b.action==='trash'&&old.status==='trash')fail(409,'Action is not valid for the current edition state.');
  p={s,old,a:JSON.parse(old.content),at:new Date().toISOString(),content:old.content,hash:old.hash,rendered:old.rendered,snapshot:old.snapshot,comparison:JSON.parse(old.comparison)};
 }else{p=await prepare(env,b);if(b.action==='publish'&&p.old||b.action==='update'&&!p.old)fail(409,'Choose the action for this edition’s current state.');}
 const {s,old,a,at}=p;if(b.confirmId!==a.id)fail(400,'Confirm the exact edition ID.');
 const status=({unpublish:'unpublished',restore:'unpublished',trash:'trash',purge:'deleted'})[b.action]||'published',revision=(old?.revision||0)+1,image=['publish','update'].includes(b.action)?cover(b.cover):old.cover;
 if(b.action==='purge'){p.content='{}';p.rendered='';p.snapshot='null';p.comparison=null;p.hash=await sha('{}');}
 const result={ok:true,id:a.id,revision,hash:p.hash,status,path:editionPath(a),version:s.version+1};
 if(new TextEncoder().encode(p.content+p.rendered+image+p.snapshot+JSON.stringify(p.comparison)).length>1900000)fail(413,'Edition storage exceeds the safe D1 row limit.');
 const statements=[q(env,'INSERT INTO publishing_state(id) SELECT 1 WHERE (SELECT version FROM publishing_state WHERE id=1)<>?',s.version),
  q(env,'INSERT INTO editions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,revision=excluded.revision,hash=excluded.hash,content=excluded.content,rendered=excluded.rendered,cover=excluded.cover,snapshot=excluded.snapshot,comparison=excluded.comparison,changed_at=excluded.changed_at',a.id,a.slug,a.editionNumber,status,revision,p.hash,p.content,p.rendered,b.action==='purge'?'':image,p.snapshot,JSON.stringify(p.comparison),a.publishedAt,at),
  q(env,'INSERT INTO edition_slugs VALUES(?,?) ON CONFLICT(slug) DO NOTHING',a.slug,a.id),
  q(env,'INSERT INTO articles(id,path,comments_enabled,reactions_enabled,active,title) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET path=excluded.path,comments_enabled=excluded.comments_enabled,reactions_enabled=excluded.reactions_enabled,active=excluded.active,title=excluded.title',a.id,editionPath(a),+a.commentsEnabled,+a.reactionsEnabled,+(status==='published'),b.action==='purge'?'Deleted edition':a.title),
  q(env,'UPDATE publishing_state SET version=version+1,next_edition=MAX(next_edition,?) WHERE id=1',a.editionNumber+1),
  q(env,'INSERT INTO publication_operations VALUES(?,?,?,?)',b.key,fingerprint,JSON.stringify(result),at)];
 if(b.action==='purge')statements.push(q(env,'DELETE FROM edition_revisions WHERE edition_id=?',a.id));
 try{await env.DB.batch(statements);}catch{const committed=await resultFor(env,b.key,fingerprint);if(committed)return json(committed);fail(409,'Publication did not commit or another edit won. Check this operation’s outcome, then refresh.');}
 return json(result);
}
export async function publicPublication(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{allow:'GET, HEAD','cache-control':'no-store'}});
 const send=(body,type='text/html; charset=utf-8',status=200,extra={})=>new Response(request.method==='HEAD'?null:body,{status,headers:{'content-type':type,'cache-control':'no-store','cdn-cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
 if(path==='/weekly')return send('',undefined,308,{location:'/weekly/'});
 if(path==='/weekly/'||/^\/weekly\/page\/[1-9]\d*\/$/.test(path)){
  const p=path==='/weekly/'?1:Number(path.split('/')[3]);if(p>10000)return send('Not found',undefined,404);
  const count=await q(env,"SELECT count(*) AS n FROM editions WHERE status='published'").first();
  const rows=(await q(env,"SELECT content FROM editions WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 8 OFFSET ?",(p-1)*8).all()).results;
  if(p>1&&!rows.length)return send('Not found',undefined,404);
  // Reuse archive renderer with only this page's summaries; never download full archive.
  let body=archive(rows.map(summary));if(!count.n&&(await state(env)).next_edition>1)body=body.replace('First edition coming soon','No editions currently available').replace('The first edition is still being prepared. When an edition has been checked and published, you’ll find it here.','Previously published editions have been withdrawn. New editions will appear here after review.');if(p>1)body=body.replace('Latest & previous editions','Previous editions').replace('Latest · ','');body=body.replace(/<nav class="weekly-edition-nav"[\s\S]*?<\/nav>/,'');body+=`<nav aria-label="Archive pages">${p>1?`<a href="${p===2?'/weekly/':`/weekly/page/${p-1}/`}">Newer editions</a>`:''} ${p*8<count.n?`<a href="/weekly/page/${p+1}/">Older editions</a>`:''}</nav>`;
  return send(page(env,'CourtUmpire Weekly','The week turned here.',path,body,'<link rel="alternate" type="application/rss+xml" href="/weekly/feed.xml">'));
 }
 if(path==='/weekly/feed.xml'){
  const rows=(await q(env,"SELECT content FROM editions WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 30").all()).results;
  return send(`<?xml version="1.0"?><rss version="2.0"><channel><title>CourtUmpire Weekly</title><link>https://courtumpire.com/weekly/</link><description>The week turned here.</description>${rows.map(r=>{const a=summary(r);return `<item><guid isPermaLink="false">${a.id}</guid><title>${esc(a.title)}</title><description>${esc(a.deck)}</description><link>https://courtumpire.com${editionPath(a)}</link><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate></item>`;}).join('')}</channel></rss>`,'application/rss+xml');
 }
 if(path==='/weekly/sitemap.xml'||/^\/weekly\/sitemap-\d+\.xml$/.test(path)){
  if(path==='/weekly/sitemap.xml'){const {n}=await q(env,"SELECT count(*) n FROM editions WHERE status='published'").first();return send(`<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({length:Math.max(1,Math.ceil(n/500))},(_,i)=>`<sitemap><loc>https://courtumpire.com/weekly/sitemap-${i+1}.xml</loc></sitemap>`).join('')}</sitemapindex>`,'application/xml');}
  const n=Number(path.match(/-(\d+)/)[1]);if(n<1||n>10000)return send('Not found',undefined,404);const rows=(await q(env,"SELECT slug,changed_at FROM editions WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 500 OFFSET ?",(n-1)*500).all()).results;
  return send(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${n===1?'<url><loc>https://courtumpire.com/weekly/</loc></url>':''}${rows.map(r=>`<url><loc>https://courtumpire.com/weekly/${esc(r.slug)}/</loc><lastmod>${r.changed_at}</lastmod></url>`).join('')}</urlset>`,'application/xml');
 }
 if(path==='/weekly/registry.json')return send(JSON.stringify({mode:'transactional-publication',manualSync:false}),'application/json');
 const m=path.match(/^\/weekly\/(\d{4}-\d{2}-\d{2}-[a-z0-9-]+)(\/|\/(?:social\.(png|svg)|analytics\.(js)))?$/);
 if(!m)return null;const row=await q(env,'SELECT e.* FROM editions e JOIN edition_slugs s ON s.edition_id=e.id WHERE s.slug=?',m[1]).first();
 if(!row||row.status!=='published')return send('Edition unavailable. <a href="/weekly/">All editions</a>',undefined,row?410:404,{'x-robots-tag':'noindex'});
 if(m[1]!==row.slug||!m[2])return send('',undefined,308,{location:'/weekly/'+row.slug+'/'+(m[3]?'social.'+m[3]:m[4]?'analytics.js':'')});
 const a=JSON.parse(row.content);
 if(m[3]==='png')return send(Uint8Array.from(atob(row.cover.split(',')[1]),c=>c.charCodeAt(0)),'image/png');
 if(m[3]==='svg')return send(social(a),'image/svg+xml');
 const other=(await q(env,"SELECT slug,json_extract(content,'$.title') title,edition_number FROM editions WHERE status='published' AND id<>? AND (edition_number=(SELECT MAX(edition_number) FROM editions WHERE status='published' AND edition_number<?) OR edition_number=(SELECT MIN(edition_number) FROM editions WHERE status='published' AND edition_number>?))",a.id,a.editionNumber,a.editionNumber).all()).results;
 const links=`<nav class="weekly-edition-nav" aria-label="Other editions">${other.map(r=>`<a href="/weekly/${esc(r.slug)}/">${r.edition_number<a.editionNumber?'Previous':'Next'} edition: ${esc(r.title)}</a>`).join('')}<a href="/weekly/">All editions</a></nav>`;
 if(m[4]==='js')return send((env.ANALYTICS_SOURCE||'').replace('const pageLocation =',`paths.add(${JSON.stringify(editionPath(a))}); const pageLocation =`),'text/javascript');
 const body=row.rendered.replace(/<nav class="weekly-edition-nav"[\s\S]*?<\/nav>/,links);
 return send(page(env,a.title,a.seoDescription,editionPath(a),body,`<meta property="og:type" content="article"><meta property="og:image" content="https://courtumpire.com${editionPath(a)}social.png"><meta property="og:image:alt" content="CourtUmpire Weekly edition cover"><script type="application/ld+json">${JSON.stringify(metadata(a)).replaceAll('<','\\u003c')}</script>`).replace('src="/analytics.js"',`src="${editionPath(a)}analytics.js"`));
}
