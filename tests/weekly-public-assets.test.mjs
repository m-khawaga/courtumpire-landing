import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPublicEntry} from '../backend/src/public-entry.mjs';

test('Weekly route preserves the navigation module imported by existing practice tools',async()=>{
  assert.match(fs.readFileSync('practice/routes.mjs','utf8'),/from '..\/weekly\/routes.mjs'/);
  const entry=createPublicEntry(()=>{throw Error('This public asset must not need origin fallback');});
  const env={PUBLIC_ORIGIN:'https://courtumpire.com',DIRECT_PUBLISHING:'true'};
  const r=await entry.fetch(new Request('https://courtumpire.com/weekly/routes.mjs'),env);
  assert.equal(r.status,200);
  assert.match(r.headers.get('content-type'),/javascript/);
  assert.equal(await r.text(),fs.readFileSync('weekly/routes.mjs','utf8'));
  const head=await entry.fetch(new Request('https://courtumpire.com/weekly/routes.mjs',{method:'HEAD'}),env);
  assert.equal(head.status,200);assert.equal(await head.text(),'');
});
