import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assertValid,eligible} from './contract.mjs';
export const hash=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
export function loadEditions(dir='content/weekly'){
  if(!fs.existsSync(dir))return [];
  const editions=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>{const a=assertValid(JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));if(n!==a.id+'.json')throw Error('Filename must match ID: '+n);if(a.status==='draft')throw Error('Drafts belong only in ignored .weekly-private/drafts, never content/weekly: '+n);return a;});
  for(const key of ['id','slug','editionNumber']){const values=editions.map(a=>a[key]).filter(x=>x!==null);if(new Set(values).size!==values.length)throw Error('Duplicate '+key);}
  return editions;
}
export const published=(editions,now)=>editions.filter(a=>eligible(a,now)).sort((a,b)=>b.editionNumber-a.editionNumber);
export function updateEdition(current,next,expected){
  assertValid(next);if(hash(current)!==expected)throw Error('Concurrent edit: source hash changed. Reimport the latest edition.');
  for(const key of ['id','editionNumber','publishedAt','issueDate'])if(current[key]!==next[key])throw Error('Immutable publication field: '+key);
  if(hash(current)===hash(next))return current;
  if(current.publishedAt&&(!next.updatedAt||Date.parse(next.updatedAt)<=Date.parse(current.updatedAt||current.publishedAt)))throw Error('A genuine revision needs a later updatedAt.');
  return next;
}
