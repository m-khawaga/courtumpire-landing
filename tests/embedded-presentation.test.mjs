import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {embeddedOptions, canonicalResource, presentationLink, nativeScoringLink} from '../weekly/embedded.mjs';
import {createPublicEntry} from '../backend/src/public-entry.mjs';

test('presentation is opt-in, follows explicit app theme, and preserves planner parameters/anchors',()=>{
  assert.equal(embeddedOptions('https://courtumpire.com/weekly/'),null);
  assert.equal(embeddedOptions('https://courtumpire.com/?cu-app=0'),null);
  assert.equal(embeddedOptions('https://courtumpire.com/?cu-app=1&cu-theme=light').theme,'light');
  const next=presentationLink('/practice-planner/?players=3#session-area','https://courtumpire.com/weekly/?cu-app=1','light');
  assert.equal(next,'https://courtumpire.com/practice-planner/?players=3&cu-app=1&cu-theme=light#session-area');
  assert.equal(presentationLink('https://example.com/source','https://courtumpire.com','dark'),'https://example.com/source');
  assert.equal(canonicalResource(next),'https://courtumpire.com/practice-planner/?players=3#session-area');
});
test('only website live scoring links are hidden; guides, quiz and normal browser scoring remain',()=>{
  assert.ok(nativeScoringLink('/play-score/scoreboard/?anything=1','https://courtumpire.com'));
  for(const path of ['/play-score/tiebreak-calculator/','/play-score/umpire-challenge/','/clubs-coaches/'])assert.ok(!nativeScoringLink(path,'https://courtumpire.com'));
  assert.ok(nativeScoringLink('/play-score/scoreboard/index.html','https://courtumpire.com'));
  const css=fs.readFileSync('weekly/embedded.css','utf8');
  assert.ok(css.includes('html[data-cu-app="1"] :is(') && css.includes('.cu-native-score-link'));
  assert.ok(fs.readFileSync('play-score/scoreboard/index.html','utf8').includes('scoreboard'));
});
test('Worker serves both opt-in presentation assets without touching publication data',async()=>{
  const entry=createPublicEntry(()=>{throw Error('No origin fallback for packaged public presentation')});
  for(const [file,type] of [['embedded.mjs','javascript'],['embedded.css','css']]){
    const response=await entry.fetch(new Request('https://courtumpire.com/weekly/'+file),{PUBLIC_ORIGIN:'https://courtumpire.com',DIRECT_PUBLISHING:'true'});
    assert.equal(response.status,200);assert.match(response.headers.get('content-type'),new RegExp(type));
    assert.equal(await response.text(),fs.readFileSync('weekly/'+file,'utf8'));
  }
});
