import fs from 'node:fs';
import path from 'node:path';
import {publicPaths} from '../practice/routes.mjs';
import {loadEditions,published} from '../weekly-core/store.mjs';
// An allowlist, never a copy of the checkout. Output is only our ignored dist folder.
const destination=path.resolve('dist');if(destination!==path.join(process.cwd(),'dist'))throw Error('Unsafe package root');
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
function copy(file){const source=path.resolve(file),target=path.join(destination,file);if(!source.startsWith(process.cwd()+path.sep)||fs.lstatSync(source).isSymbolicLink())throw Error('Unsafe asset '+file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
for(const route of publicPaths)copy(route==='/'?'index.html':route.slice(1)+(route.endsWith('/')?'index.html':''));
for(const file of ['styles.css','analytics.js','robots.txt','sitemap.xml','CNAME','weekly/weekly.css','weekly/weekly.mjs','weekly/engagement.mjs','weekly/dates.mjs','assets/weekly/LICENSE.txt','weekly/feed.xml','weekly/registry.json'])copy(file);
function assets(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())assets(file);else if(/\.(png|jpe?g|webp|svg|ico|woff2?|mp4|webm|vtt|css|mjs|js|json)$/i.test(file)&&!/(?:^|[\\/])(routes|site-config)\.mjs$/.test(file))copy(file);}}
for(const dir of ['assets','practice','tools'])assets(dir);
// Browser-side practice rendering still imports the public navigation registry.
for(const file of ['practice/routes.mjs','practice/site-config.mjs','weekly/routes.mjs'])copy(file);
const editions=published(loadEditions());for(const a of editions)copy(`weekly/${a.slug}/social.png`);
const redirects=JSON.parse(fs.readFileSync('weekly-core/redirects.json','utf8'));for(const [slug,id]of Object.entries(redirects))if(editions.some(a=>a.id===id))copy(`weekly/${slug}/index.html`);
fs.writeFileSync(path.join(destination,'.nojekyll'),'');
console.log('Built dist/ from an explicit public allowlist. No editor, drafts, content sources, backend, tests or private notes. Nothing uploaded.');
