import fs from 'node:fs';import path from 'node:path';import {hash} from './store.mjs';
export function removeEdition(root,{mode,id,expected,confirmation}){
 if(!['draft','permanent'].includes(mode)||!/^cu-weekly-\d{4}-\d{2}-\d{2}$/.test(id))throw Error('Use draft or permanent and an exact Weekly edition ID.');
 if(confirmation!==`DELETE ${id}`)throw Error('Explicit confirmation required: DELETE '+id);
 const base=path.resolve(root),privateDir=path.join(base,'.weekly-private'),folder=path.join(privateDir,'drafts'),file=path.join(folder,id+'.json');
 for(const part of [privateDir,folder,file])if(fs.existsSync(part)&&fs.lstatSync(part).isSymbolicLink())throw Error('Symlink source paths are not permitted.');
 if(fs.existsSync(path.join(base,'content/weekly',id+'.json')))throw Error('Public source still exists. Unpublish and rebuild first.');
 const lock=path.join(privateDir,'import.lock');fs.mkdirSync(lock);
 try{const a=JSON.parse(fs.readFileSync(file,'utf8'));if(a.id!==id||a.status!=='draft'||hash(a)!==expected)throw Error('Saved source changed or is not a draft. Reload its hash before retrying.');
 if(mode==='draft'&&a.publishedAt)throw Error('Previously published edition: use permanent after unpublishing.');
 if(mode==='permanent'&&!a.publishedAt)throw Error('Never-published source: use Delete saved draft.');
 const redirectsFile=path.join(base,'weekly-core/redirects.json'),ledgerFile=path.join(base,'weekly-core/publication-history.json');
 if(mode==='permanent'){const redirects=JSON.parse(fs.readFileSync(redirectsFile,'utf8')),ledger=JSON.parse(fs.readFileSync(ledgerFile,'utf8'));if(ledger[id]?.status==='published')throw Error('Publication ledger still marks this edition published.');for(const slug of Object.keys(redirects))if(redirects[slug]===id)delete redirects[slug];ledger[id]={...(ledger[id]||{editionNumber:a.editionNumber,publishedAt:a.publishedAt,slug:a.slug}),status:'deleted',hash:expected};fs.writeFileSync(redirectsFile,JSON.stringify(redirects,null,2)+'\n');fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2)+'\n');}
 fs.unlinkSync(file);return {id,mode,removed:file};
 }finally{fs.rmdirSync(lock);}
}
