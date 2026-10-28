import fs from 'node:fs';
import {hash} from '../weekly-core/store.mjs';
import {assertValid} from '../weekly-core/contract.mjs';
if(!process.argv[2])throw Error('Provide the edition JSON filename.');
console.log(hash(assertValid(JSON.parse(fs.readFileSync(process.argv[2],'utf8')))));
