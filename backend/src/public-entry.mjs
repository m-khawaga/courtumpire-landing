import {createHandler} from './worker.mjs';
import {scheduled} from './retention.mjs';
import {shell,assets,staticSitemap,analytics} from './public-assets.generated.mjs';
import {teaser} from '../../weekly-core/render.mjs';
const handler=createHandler();
export function createPublicEntry(originFetch=fetch){return {scheduled,async fetch(request,env){
 const u=new URL(request.url);env={...env,ANALYTICS_SOURCE:analytics,PUBLIC_SHELL:env.PUBLIC_SHELL||shell,PUBLIC_ASSETS:{...assets,"/weekly/site-static.xml":{body:staticSitemap,type:"application/xml"}}};
 if(u.origin!==env.PUBLIC_ORIGIN||u.pathname==='/weekly'||u.pathname.startsWith('/weekly/'))return handler(request,env);
 if(env.DIRECT_PUBLISHING!=='true')return originFetch(request);
 if(!['GET','HEAD'].includes(request.method))return originFetch(request);
 const respond=(text,type='text/html')=>new Response(request.method==='HEAD'?null:text,{headers:{'content-type':type+'; charset=utf-8','cache-control':'no-store','cdn-cache-control':'no-store'}});
 if(u.pathname==='/sitemap.xml'){const {n}=await env.DB.prepare("SELECT count(*) n FROM editions WHERE status='published'").first();return respond('<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://courtumpire.com/weekly/site-static.xml</loc></sitemap>'+Array.from({length:Math.max(1,Math.ceil(n/500))},(_,i)=>'<sitemap><loc>https://courtumpire.com/weekly/sitemap-'+(i+1)+'.xml</loc></sitemap>').join('')+'</sitemapindex>','application/xml');}
 if(u.pathname==='/'||u.pathname==='/index.html'||u.pathname==='/site-map/'){
  const origin=await originFetch(request);if(!origin.ok)return origin;
  // Origin is the existing bounded, owned GitHub Pages HTML, not an arbitrary URL.
  if(Number(origin.headers.get('content-length'))>1000000)return new Response('Origin unavailable',{status:503});
  const reader=origin.body?.getReader();let size=0,chunks=[];if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000){await reader.cancel();return new Response('Origin unavailable',{status:503});}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}let html=new TextDecoder().decode(bytes);
  if(u.pathname==='/site-map/')html=html.replace('</main>','<p><a href="/weekly/">All current Weekly editions</a> · <a href="/weekly/sitemap.xml">Weekly sitemap</a></p></main>');
  else {const r=await env.DB.prepare("SELECT content FROM editions WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 1").first();html=html.replace(/<aside class="container weekly-teaser"[\s\S]*?<\/aside>/,'');if(r){const marker=html.indexOf('Who’s on court today');const start=html.lastIndexOf('<section',marker);if(marker>=0&&start>=0)html=html.slice(0,start)+teaser(JSON.parse(r.content))+html.slice(start);}}
  return respond(html);
 }
 return originFetch(request);
}};}
export default createPublicEntry();
