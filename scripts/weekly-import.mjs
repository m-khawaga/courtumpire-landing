import {prepareHistory} from '../weekly-core/ranking-store.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assertValid} from '../weekly-core/contract.mjs';
import {loadEditions,hash,updateEdition} from '../weekly-core/store.mjs';
const [mode,file,...flags]=process.argv.slice(2),get=k=>flags[flags.indexOf(k)+1];
if(!['create','update','unpublish'].includes(mode)||!file){console.error('Usage: npm run weekly:import -- create|update|unpublish FILE [--expected HASH] [--approve-publication]');process.exit(1);}
fs.mkdirSync('.weekly-private/drafts',{recursive:true});
const lock='.weekly-private/import.lock';try{fs.mkdirSync(lock);}catch{throw Error('Another import holds the lock. Retry after it completes.');}
try{
  const incoming=assertValid(JSON.parse(fs.readFileSync(file,'utf8'))),all=loadEditions(),publicPath=path.join('content/weekly',incoming.id+'.json'),privatePath=path.join('.weekly-private/drafts',incoming.id+'.json');
  const current=all.find(a=>a.id===incoming.id)||(fs.existsSync(privatePath)?JSON.parse(fs.readFileSync(privatePath,'utf8')):null);
  const ledgerPath='weekly-core/publication-history.json',ledger=JSON.parse(fs.existsSync(ledgerPath)?fs.readFileSync(ledgerPath,'utf8'):'{}');
  let next=structuredClone(incoming);
  if(mode==='create'){
    if(current||ledger[next.id])throw Error('ID already exists. Use Update existing edition with its source hash.');
    if(next.status!=='draft'||next.publishedAt||next.updatedAt||next.editionNumber)throw Error('Create starts from a draft with null publication metadata.');
  }else{
    if(!current)throw Error('Edition not found in public sources or private drafts.');
    next=updateEdition(current,next,get('--expected'));
  }
  if(flags.includes('--approve-publication')){
    if(mode==='unpublish')throw Error('Unpublish cannot approve publication.');
    if(!next.publishedAt){next.editionNumber=Math.max(0,...all.map(a=>a.editionNumber||0),...Object.values(ledger).map(a=>a.editionNumber||0))+1;next.publishedAt=new Date().toISOString();next.updatedAt=null;}
    next.status='published';
  }else if(next.status==='published'&&(!current||current.status!=='published'))throw Error('Publication requires --approve-publication after review.');
  if(mode==='unpublish'){if(!current?.publishedAt)throw Error('Edition is not published.');next.status='draft';next.updatedAt=new Date().toISOString();}
  assertValid(next);
  for(const a of all.filter(a=>a.id!==next.id))if(a.slug===next.slug||next.editionNumber&&a.editionNumber===next.editionNumber)throw Error('Duplicate slug or edition number.');
  const redirectsPath='weekly-core/redirects.json',redirects=JSON.parse(fs.readFileSync(redirectsPath,'utf8'));
  if(redirects[next.slug]&&redirects[next.slug]!==next.id)throw Error('Slug reserved by another edition redirect.');
  if(current&&current.slug!==next.slug&&current.publishedAt)redirects[current.slug]=next.id;
  delete redirects[next.slug];
  const rankingHistory=next.status==='published'?prepareHistory(next,all):null;
  const destination=next.status==='published'?publicPath:privatePath;
  // All conflict and schema checks finish before writes. The lock serializes writers.
  if(current)fs.writeFileSync(`.weekly-private/${current.id}-${hash(current)}.json`,JSON.stringify(current,null,2));
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination+'.tmp',JSON.stringify(next,null,2)+'\n');fs.renameSync(destination+'.tmp',destination);
  if(mode==='unpublish'&&fs.existsSync(publicPath))fs.unlinkSync(publicPath);
  if(next.publishedAt)ledger[next.id]={editionNumber:next.editionNumber,publishedAt:next.publishedAt,slug:next.slug,status:next.status==='published'?'published':'unpublished',hash:hash(next)};
  if(rankingHistory)fs.writeFileSync('weekly-core/ranking-history.json',JSON.stringify(rankingHistory,null,2)+'\n');
  fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');fs.writeFileSync(redirectsPath,JSON.stringify(redirects,null,2)+'\n');
  console.log(`Prepared locally: ${destination}\nSource hash: ${hash(next)}\nNothing is live. Review the diff and build before approving the existing GitHub publication workflow.`);
  if(next.status==='published'||current?.publishedAt){const result=spawnSync(process.execPath,['scripts/weekly-build.mjs'],{stdio:'inherit'});if(result.status)process.exitCode=result.status;}
}finally{fs.rmdirSync(lock);}
