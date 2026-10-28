import fs from 'node:fs';
import {assertValid} from '../weekly-core/contract.mjs';
import {loadEditions,published} from '../weekly-core/store.mjs';
import {snapshot,comparisonFor,calculateChanges,rankingErrors,comparisonRows,tours} from '../weekly-core/rankings.mjs';
import {readHistory} from '../weekly-core/ranking-store.mjs';
const [input,output]=process.argv.slice(2);if(!input||!output||!output.replaceAll('\\','/').startsWith('.weekly-private/'))throw Error('Usage: node scripts/weekly-rankings.mjs INPUT .weekly-private/OUTPUT.json');
const a=assertValid(JSON.parse(fs.readFileSync(input,'utf8'))),previous=comparisonFor(a,published(loadEditions()).map(snapshot),readHistory());calculateChanges(a,previous);const errors=rankingErrors(a,previous);if(errors.length)throw Error(errors.map(e=>e.path+': '+e.message).join('\n'));fs.writeFileSync(output,JSON.stringify(a,null,2)+'\n',{flag:'wx'});console.log('Prepared comparison against '+(previous?.id||'First edition — no comparison')+'. Nothing published.');for(const t of tours)for(const row of comparisonRows(a,t.id,previous))for(const warning of row.warnings)console.log(t.id+' row '+(row.index+1)+': '+warning);
