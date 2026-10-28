import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {adminJs} from '../backend/src/admin.mjs';

test('moderation reports a failed first cleanup, missing runs, recovery and unavailable health',async()=>{
 const elements=new Map();const element=key=>{if(!elements.has(key))elements.set(key,{textContent:'',classList:{toggle(){}},hidden:false});return elements.get(key);};
 let runs=[],unavailable=false;
 const context=vm.createContext({document:{querySelector:element},Date,URLSearchParams,
  fetch:async url=>{if(url.endsWith('/retention-health')){if(unavailable)throw Error('offline');return {ok:true,json:async()=>({runs})};}throw Error('Skip unrelated initial load');}
 });
 vm.runInContext(adminJs,context);
 runs=[{kind:'daily',last_success:null,failed:1}];
 await element('#retention-check').onclick();
 assert.match(element('#retention-health').textContent,/daily: FAILED/);
 assert.match(element('#retention-health').textContent,/hourly: not yet verified/);
 runs=[{kind:'hourly',last_success:new Date().toISOString(),failed:0},{kind:'daily',last_success:new Date().toISOString(),failed:0}];
 await element('#retention-check').onclick();
 assert.doesNotMatch(element('#retention-health').textContent,/FAILED|OVERDUE|not yet/);
 unavailable=true;await element('#retention-check').onclick();
 assert.match(element('#retention-health').textContent,/unavailable/);
});
