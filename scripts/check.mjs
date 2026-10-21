import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { canonicalUrl, canonicalPaths, ancestors, routeByPath } from '../practice/routes.mjs';
import { navigation } from '../practice/site-config.mjs';
const dirs = ['practice','tools','scripts','tests'];
const files = ['analytics.js',...dirs.flatMap(dir=>fs.readdirSync(dir).filter(n=>/\.(mjs|cjs)$/.test(n)).map(n=>path.join(dir,n)))];
for (const file of files) {
  const result = spawnSync(process.execPath,['--check',file],{ encoding:'utf8' });
  if (result.status!==0) { console.error(result.stderr); process.exit(1); }
}
const routes = JSON.parse(fs.readFileSync('practice/routes.json','utf8'));
const titles = new Set();
for (const route of routes) {
  const html = fs.readFileSync('.'+(route.endsWith('/')?route+'index.html':route),'utf8');
  const def=routeByPath.get(route);
  if(!def.noindex && !html.includes(`href="${canonicalUrl(route)}"`)) throw new Error('Canonical missing: '+route);
  if(!def.noindex && /<meta[^>]+name="robots"[^>]+noindex/i.test(html))throw new Error('Unexpected noindex: '+route);
  if(def.noindex && !html.includes('content="noindex, follow"'))throw new Error('Missing intentional noindex: '+route);
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  if (titles.has(title)) throw new Error('Duplicate title: '+route); titles.add(title);
}
const sitemap=fs.readFileSync('sitemap.xml','utf8');
if(!sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) throw new Error('Wrong sitemap namespace');
const actual=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(JSON.stringify(actual)!==JSON.stringify(canonicalPaths.map(canonicalUrl))) throw new Error('Generated sitemap disagrees with canonical route registry');
if(new Set(actual).size!==actual.length || actual.some(url=>new URL(url).origin!=='https://courtumpire.com'||/[?#]/.test(url))) throw new Error('Duplicate/preview/query URL in sitemap');
for(const n of navigation.flatMap(n=>[n,...(n.children||[])])) {
  const url=new URL(n.href,'https://courtumpire.com');
  if(url.origin==='https://courtumpire.com' && !routes.includes(url.pathname==='\/index.html'?'/':url.pathname)) throw new Error('Unregistered navigation target '+url.pathname);
}
for(const route of routes) ancestors(route);
console.log(`Sitemap verified: ${actual.length} production canonicals; compatibility /tools/, draft tools, shop, sessions and query/preview combinations excluded.`);
console.log(`Syntax checked ${files.length} scripts; verified ${routes.length} static routes and unique titles. No linter dependency required.`);
