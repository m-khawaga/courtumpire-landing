import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeDefinitions} from '../practice/routes.mjs';
import {catalogueFromRoutes,validateCatalogue,permittedToolUrl,cataloguePath} from '../practice/explore-catalogue.mjs';
import {createPublicEntry} from '../backend/src/public-entry.mjs';

test('public catalogue is derived from existing route identities and matches the bundled fallback',()=>{
 const value=catalogueFromRoutes();assert.deepEqual(value,JSON.parse(fs.readFileSync('practice/explore.v1.json','utf8')));
 assert.deepEqual(value.entries.map(e=>e.id),['drills','quiz','clubs']);
 for(const e of value.entries){assert.ok(routeDefinitions.some(r=>r.id===e.id&&'https://courtumpire.com'+r.path===e.url));assert.ok(!e.url.includes('/scoreboard/'));}
});
test('adding, hiding, removing and reordering real tools only changes the website catalogue',()=>{
 const routes=structuredClone(routeDefinitions),result=routes.find(r=>r.id==='result');
 result.explore={description:'Make a result card',category:'Play & learn',order:0,icon:'tool'};
 let value=catalogueFromRoutes(routes);assert.equal(value.entries[0].id,'result');
 routes.find(r=>r.id==='drills').explore.visible=false;assert.equal(catalogueFromRoutes(routes).entries.find(e=>e.id==='drills').visible,false);
 delete routes.find(r=>r.id==='quiz').explore;assert.ok(!catalogueFromRoutes(routes).entries.some(e=>e.id==='quiz'));
 const scoring=routes.find(r=>r.id==='scoreboard');scoring.explore={description:'Forbidden',category:'Play',order:0,icon:'tool'};
 assert.throws(()=>catalogueFromRoutes(routes),/forbidden/);
});
test('author validation rejects malformed, duplicate, unregistered and privileged destinations',()=>{
 const original=catalogueFromRoutes();
 assert.throws(()=>validateCatalogue({...original,unexpectedPadding:'x'.repeat(64*1024)}),/64 KiB/);
 for(const url of ['http://courtumpire.com/tennis-drills/','https://evil.test/tennis-drills/','https://courtumpire.com/admin/','https://courtumpire.com/weekly/edition/','https://courtumpire.com/play-score/scoreboard/','https://courtumpire.com/clubs-coaches/api/','https://courtumpire.com/tennis-drills/?cu-action=print'])assert.equal(permittedToolUrl(url),false,url);
 for(const change of [v=>v.schemaVersion=2,v=>v.entries.push({...v.entries[0]}),v=>delete v.entries[0].description,v=>v.entries[0].icon='unknown',v=>v.entries[0].url='https://courtumpire.com/clubs-coaches/not-created/']){const v=structuredClone(original);change(v);assert.throws(()=>validateCatalogue(v));}
});
test('catalogue is packaged in Pages output and public Worker falls through unchanged',async()=>{
 assert.deepEqual(JSON.parse(fs.readFileSync('dist'+cataloguePath,'utf8')),catalogueFromRoutes());
 let requested='';const entry=createPublicEntry(request=>{requested=new URL(request.url).pathname;return new Response(fs.readFileSync('dist'+requested),{headers:{'content-type':'application/json'}})});
 const response=await entry.fetch(new Request('https://courtumpire.com'+cataloguePath),{PUBLIC_ORIGIN:'https://courtumpire.com',DIRECT_PUBLISHING:'true'});
 assert.equal(response.status,200);assert.equal(requested,cataloguePath);assert.deepEqual(await response.json(),catalogueFromRoutes());
});
