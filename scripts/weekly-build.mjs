import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadEditions,published} from '../weekly-core/store.mjs';
import {archiveRoutes} from '../weekly-core/archive.mjs';
const editions=published(loadEditions());
const routes=[{path:'/weekly/',title:'CourtUmpire Weekly — The week turned here',label:'CourtUmpire Weekly',section:'weekly',parent:'/'},{path:'/weekly/privacy/',title:'Weekly privacy and participation',label:'Weekly privacy',section:'weekly',parent:'/weekly/'}];
for(let i=2;i<=Math.ceil(editions.length/8);i++)routes.push({path:`/weekly/page/${i}/`,title:`CourtUmpire Weekly archive — Page ${i}`,label:`Archive page ${i}`,section:'weekly',parent:'/weekly/'});
for(const a of editions)routes.push({path:`/weekly/${a.slug}/`,title:a.title,label:a.title,section:'weekly',parent:'/weekly/'});
routes.push(...archiveRoutes(editions));
// Discover generated outputs from disk, including a fresh checkout with no private
// build cache. Unpublishing must remove old HTML from legacy Pages as well as dist.
const redirects=JSON.parse(fs.readFileSync('weekly-core/redirects.json','utf8'));
const keep=new Set([...routes.map(r=>r.path),...Object.entries(redirects).filter(([,id])=>editions.some(a=>a.id===id)).map(([slug])=>`/weekly/${slug}/`)]);
const weeklyRoot=path.resolve('weekly');
function prune(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(!entry.isDirectory())continue;const target=path.resolve(dir,entry.name),relative=path.relative(weeklyRoot,target).replaceAll('\\','/');if(!target.startsWith(weeklyRoot+path.sep)||fs.lstatSync(target).isSymbolicLink())throw Error('Unsafe generated output path');if(/^(?:\d{4}-\d{2}-\d{2}-[a-z0-9-]+|page\/\d+|month\/\d{4}-\d{2}(?:\/page\/\d+)?)$/.test(relative)&&![...keep].some(r=>r.startsWith('/weekly/'+relative+'/')))fs.rmSync(target,{recursive:true,force:true});else if(/^(?:page|month|month\/\d{4}-\d{2}|month\/\d{4}-\d{2}\/page)$/.test(relative))prune(target);}}
prune(weeklyRoot);
fs.writeFileSync('weekly/routes.mjs','// Generated from eligible published editions only.\nexport const weeklyRoutes='+JSON.stringify(routes,null,2)+';\n');
const run=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});if(run.status!==0)process.exit(run.status||1);
