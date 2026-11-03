import {routeDefinitions, productionOrigin} from './routes.mjs';
export const cataloguePath = '/practice/explore.v1.json';
export const exploreIcons = ['drills','quiz','groups','tool','guide','practice'];
export function permittedToolUrl(value) {
  try {
    const u=new URL(value), p=u.pathname;
    return u.origin===productionOrigin && !u.username && !u.password && !u.search && !u.hash &&
      /^\/[a-z0-9/-]+\/$/.test(p) && !p.includes('//') && !p.split('/').some(x=>['admin','api','authoring','backend','private','moderation','editor'].includes(x)) &&
      !p.startsWith('/play-score/scoreboard/') &&
      (p==='/practice-planner/' || ['/practice/','/tennis-drills/','/play-score/','/clubs-coaches/'].some(prefix=>p.startsWith(prefix)));
  } catch { return false; }
}
export function validateCatalogue(value, definitions=routeDefinitions) {
  if(new TextEncoder().encode(JSON.stringify(value,null,2)+'\n').length>64*1024)throw Error('Catalogue exceeds 64 KiB');
  if(value?.schemaVersion!==1 || !Array.isArray(value.entries) || value.entries.length>60)throw Error('Unsupported catalogue schema');
  const ids=new Set();
  for(const e of value.entries) {
    if(!e || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(e.id) || ids.has(e.id))throw Error('Invalid/duplicate catalogue ID');
    ids.add(e.id);
    for(const [key,max]of [['title',80],['description',180],['category',40]])if(typeof e[key]!=='string'||!e[key].trim()||e[key].length>max)throw Error('Invalid '+key);
    if(!Number.isInteger(e.order)||e.order<0||e.order>10000||!exploreIcons.includes(e.icon)||e.visible!==undefined&&typeof e.visible!=='boolean')throw Error('Invalid catalogue presentation');
    if(!permittedToolUrl(e.url)||!definitions.some(r=>productionOrigin+r.path===e.url&&r.id===e.id&&r.sitemap!==false))throw Error('Unregistered or forbidden tool URL');
  }
  return value;
}
export function catalogueFromRoutes(definitions=routeDefinitions) {
  const entries=definitions.filter(r=>r.explore).map(r=>({id:r.id,title:r.label,description:r.explore.description,category:r.explore.category,order:r.explore.order,url:productionOrigin+r.path,icon:r.explore.icon,...(r.explore.visible===undefined?{}:{visible:r.explore.visible})}));
  entries.sort((a,b)=>a.order-b.order||(a.id<b.id?-1:a.id>b.id?1:0));
  return validateCatalogue({schemaVersion:1,entries},definitions);
}
