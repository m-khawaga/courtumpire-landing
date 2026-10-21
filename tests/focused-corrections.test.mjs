import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRotation,rotationDocument,rotationText} from '../tools/rotation-controller.mjs';
import {scoreSheet,blankScoreModel} from '../tools/club-documents.mjs';
const base={names:'Alex\nSam\nJordan\nCasey\nRobin\nTaylor\nMorgan\nJamie',mode:'doubles',courtMode:'custom',labels:'3, 7, Indoor A',output:'filled',duration:'01:10',round:'00:10',changeover:'2',start:'23:30'};
test('available courts never force incomplete teams; both preferences are deterministic and conserve participation',()=>{
 const max=buildRotation(base,{date:'2026-10-21'});assert.equal(max.plan.activeCourts,2);assert.equal(max.plan.totals.every(t=>t.rest===0),true);assert.match(rotationDocument(max),/Unused courts: Indoor A/);assert.match(rotationText(max),/Court 7:/);assert.doesNotMatch(rotationText(max),/Court 1:/);
 for(const preference of ['maximize','rest'])for(const n of [4,8,9,17,32]){const settings={...base,preference,names:Array.from({length:n},(_,i)=>`P${i}`).join('\n')},c=buildRotation(settings);assert.deepEqual(c.plan,buildRotation(settings).plan);for(const r of c.plan.rounds){const active=r.courts.flatMap(c=>c.teams.flat());assert.equal(new Set(active).size,active.length);assert.equal(active.length+r.rests.length,n);assert.ok(r.courts.every(c=>c.teams.every(t=>t.length===2)));assert.ok(r.rests.every(i=>!active.includes(i)));}assert.ok(c.plan.imbalance<=1);for(const t of c.plan.totals)assert.equal(t.play+t.rest,60);}
 const rest=buildRotation({...base,preference:'rest'});assert.equal(rest.plan.activeCourts,1);assert.ok(rest.plan.totals.every(t=>t.restRounds===3));const uneven=buildRotation({...base,names:base.names+'\nP9'});assert.match(rotationDocument(uneven),/Equal rest is impossible/);assert.equal(uneven.plan.activeCourts,2);
});
test('planning modes validate only their own budget and use no trailing break',()=>{
 const duration=buildRotation({...base,roundCount:'not a count'});assert.equal(duration.plan.rounds.length,6);assert.equal(duration.plan.used,70);assert.equal(duration.plan.unused,0);
 const rounds=buildRotation({...base,planningMode:'rounds',roundCount:'6',duration:'invalid inactive value'},{date:'2026-10-21'});assert.equal(rounds.duration,70);assert.equal(rounds.plan.used,70);assert.match(rotationDocument(rounds),/00:40 \(\+1 day, 2026-10-22\)/);assert.doesNotMatch(rotationDocument(rounds),/Booked session ends/);
 const single=buildRotation({...base,planningMode:'rounds',roundCount:'1',duration:'00:00'});assert.equal(single.duration,10);assert.equal(single.plan.rounds[0].end,10);assert.match(rotationDocument(single),/No break after final round/);
 for(const roundCount of ['0','-1','1.5','37',''])assert.throws(()=>buildRotation({...base,planningMode:'rounds',roundCount}));assert.throws(()=>buildRotation({...base,duration:'invalid',roundCount:'6'}));
 const unused=buildRotation({...base,duration:'01:15'});assert.equal(unused.plan.unused,5);
});
test('score cells integrate handwriting areas without a second tiebreak table or games in a deciding points column',()=>{
 for(const [format,normal]of [['one-set',1],['best-three',3],['match-tiebreak',2]]){const html=scoreSheet({...blankScoreModel(),format});assert.equal((html.match(/sheet-tb-field/g)||[]).length,normal*2);assert.equal((html.match(/<table/g)||[]).length,2);assert.match(html,/Enter TB points only if a tiebreak was played\./);if(format==='match-tiebreak')assert.match(html,/<td><span class="sheet-score-field">Points<\/span><\/td>/);}
});
