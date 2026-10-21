import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activities, byId } from '../practice/catalogue.mjs';
import { defaults, generate, compatible, conflicts, total, swapOptions, add, restore, save, load } from '../practice/core.mjs';
import { adMode, advertising } from '../practice/ads-config.mjs';
import { video, videoReady, court } from '../practice/render.mjs';
test('50 unique complete activities, at least four for every player count, meaningful diagrams',()=>{
  assert.equal(activities.length,50); assert.equal(new Set(activities.map(a=>a.id)).size,50);
  for (const players of [1,2,3,4]) assert.ok(activities.filter(a=>a.players.includes(players)).length>=4);
  for (const a of activities) {
    for (const field of ['setup','scoring','rotation','easier','harder','mixed','review']) assert.ok(a[field].length>15,`${a.id}: ${field}`);
    assert.ok(a.instructions.length>=4); assert.ok(a.diagram.description.length>30); assert.ok(a.diagram.players.length===a.players[0]);
    assert.ok(a.diagram.balls.length || a.diagram.moves.length); assert.ok(court(a).includes('<desc'));
  }
});
test('all normal player/level/goal/time combinations are compatible, deterministic and exact',()=>{
  for (const players of [1,2,3,4]) for (const duration of [30,45,60,90,180]) for (const level of ['Beginner','Intermediate','Advanced','Mixed']) for (const goal of ['Fun games','Technique practice','Match preparation','A mix']) {
    const settings = {...defaults,players,duration,level,goal};
    const plan = generate(settings); assert.equal(total(plan),duration);
    assert.deepEqual(plan,generate(settings)); assert.equal(new Set(plan.blocks.map(b=>b.id)).size,plan.blocks.length);
    assert.ok(byId.get(plan.blocks[0].id).intro);
    for (const b of plan.blocks) { const a=byId.get(b.id); assert.equal(conflicts(a,settings).length,0); assert.ok(b.minutes>=a.minimum); assert.ok(!a.facilities.includes('wall')); if(level==='Beginner') assert.equal(a.level,'Beginner'); }
  }
});
test('wall and explicit player compatibility; unavailable facility never selected',()=>{
  const solo={...defaults,players:1}; assert.ok(!compatible(solo).some(a=>a.id==='wall-consistency'));
  assert.ok(compatible({...solo,facilities:['court','wall']}).some(a=>a.id==='wall-consistency'));
  assert.ok(conflicts(byId.get('wall-consistency'),defaults).length===2);
  for (const a of compatible({...defaults,players:3})) assert.equal(a.players[0],3);
});
test('bounded input and impossible minimum produce useful errors',()=>{
  assert.throws(()=>generate({...defaults,duration:15}),/at least.*minutes/);
  for (const duration of [0,14,181,30.5,NaN]) assert.throws(()=>generate({...defaults,duration}),/15 to 180/);
  assert.throws(()=>generate({...defaults,players:5}));
});
test('compatible swaps exclude repeats, incompatible facilities and short blocks',()=>{
  const plan=generate({...defaults,level:'Intermediate'});
  for (let i=0;i<plan.blocks.length;i++) for (const a of swapOptions(plan,i)) { assert.equal(conflicts(a,plan.settings).length,0); assert.ok(!plan.blocks.some(b=>b.id===a.id)); assert.ok(a.minimum<=plan.blocks[i].minutes); }
});
test('manual totals and library additions retain targets, explain incompatibility',()=>{
  const plan=generate(defaults); plan.blocks[0].minutes+=4; assert.equal(total(plan),64); assert.equal(plan.settings.duration,60);
  const a=compatible(plan.settings)[0], appended=add(plan,a.id); assert.equal(total(appended),total(plan)+a.suggested+1); assert.equal(appended.edited,true);
  assert.throws(()=>add(plan,'wall-consistency'),/Needs 1 player/); assert.equal(plan.blocks.length,3);
});
test('versioned persistence restores known ids and rejects malformed, incompatible or invalid data',()=>{
  const plan=generate(defaults); assert.deepEqual(restore(JSON.stringify(plan)),plan);
  for (const raw of ['',null,'{','{}',JSON.stringify({...plan,version:2}),JSON.stringify({...plan,blocks:[{id:'missing',minutes:20}]}),JSON.stringify({...plan,blocks:[{id:plan.blocks[0].id,minutes:1}]}),JSON.stringify({...plan,settings:{...plan.settings,players:1}})]) assert.equal(restore(raw),null);
  const unavailable={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.equal(load(unavailable).unavailable,true); assert.equal(save(unavailable,plan),false);
  let raw=null; const memory={getItem(){return raw;},setItem(k,v){raw=v;}}; assert.equal(save(memory,plan),true); assert.deepEqual(load(memory).session,plan);
});
test('ad modes fail closed on public origins and live is impossible, even with query/config/consent',()=>{
  assert.equal(advertising.mode,'off'); assert.equal(advertising.provider,null); assert.equal(advertising.consent(),'unknown');
  for(const hostname of ['courtumpire.com','preview.example','localhost.evil']) for(const search of ['','?ads=preview','?ads=live']) assert.equal(adMode({hostname,search}),'off');
  assert.equal(adMode({hostname:'127.0.0.1',search:'?ads=preview'}),'preview');
  for(const mode of ['off','live']) assert.equal(adMode({hostname:'localhost',search:'?ads=live'},{...advertising,mode,provider:{},consent:()=> 'granted'}),'off');
});
test('missing/draft/unsafe videos have no player; reviewed ready local video has controls/captions/transcript',()=>{
  assert.ok(!video(activities[0]).includes('<video'));
  const v={status:'ready',source:'/assets/videos/demo.mp4',title:'Reviewed demonstration',language:'en',duration:'01:20',captions:'/assets/videos/demo.vtt',transcript:'Purpose, setup, demonstration, rotation and scoring.',credits:'Original reviewed media'};
  assert.ok(videoReady(v)); const html=video({...activities[0],video:v}); assert.ok(html.includes('controls preload="none"')); assert.ok(html.includes('<track')); assert.ok(html.includes('Read video transcript')); assert.ok(!html.includes('autoplay'));
  for(const source of ['https://external.example/ad.mp4','javascript:alert(1)','/assets/../private.mp4','']) assert.equal(videoReady({...v,source}),false);
  assert.equal(videoReady({...v,status:'draft'}),false);
});
