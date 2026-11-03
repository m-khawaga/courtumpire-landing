import fs from 'node:fs';
import {catalogueFromRoutes} from '../practice/explore-catalogue.mjs';
const file='practice/explore.v1.json', body=JSON.stringify(catalogueFromRoutes(),null,2)+'\n';
if(process.argv.includes('--check')) {if(fs.readFileSync(file,'utf8')!==body)throw Error('Explore catalogue is stale: run node scripts/explore-catalogue-build.mjs');}
else fs.writeFileSync(file,body);
console.log('Validated website-managed Explore catalogue. No article content or live scoring entries.');
