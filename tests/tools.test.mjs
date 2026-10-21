import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,point,replayMatch,tieServer,tiebreakSituation,normalSituation,validateResult,restoreMatch,gameLabel} from '../tools/scoring.mjs';
import {schedule} from '../tools/rotations.mjs';
import {questions} from '../tools/quiz.mjs';
import {newChecklist,restoreChecklist} from '../tools/checklist.mjs';
function game(s,w){const games=s.games.join(),sets=s.sets.length;for(let i=0;i<20;i++){s=point(s,w);if(s.games.join()!==games||s.sets.length!==sets)return s;}throw new Error('Game did not finish');}
test('advantage, deuce, game server/end changes and point-accurate undo through replay',()=>{
 const config={names:['A','B'],first:0,format:'one-set'},history=[0,1,0,1,0,1];let s=replayMatch(config,history);assert.deepEqual(gameLabel(s.points),['40','40']);s=point(s,0);assert.deepEqual(gameLabel(s.points),['AD','40']);s=point(s,1);assert.deepEqual(gameLabel(s.points),['40','40']);s=point(point(s,0),0);assert.deepEqual(s.games,[1,0]);assert.equal(s.server,1);assert.equal(s.changeEnds,true);assert.deepEqual(replayMatch(config,[...history,0,1]),point(point(replayMatch(config,history),0),1));
});
test('normal 6–0, 7–5 and 7–6 sets; no points accepted after match win',()=>{
 let s=createMatch({format:'one-set'});for(let i=0;i<6;i++)s=game(s,0);assert.equal(s.winner,0);assert.equal(point(s,1),s);assert.deepEqual(s.sets[0].score,[6,0]);
 s=createMatch({format:'one-set'});for(let i=0;i<5;i++){s=game(s,0);s=game(s,1);}s=game(s,0);assert.equal(s.winner,null);s=game(s,0);assert.deepEqual(s.sets[0].score,[7,5]);
 s=createMatch({format:'best-three',first:1});for(let i=0;i<6;i++){s=game(s,0);s=game(s,1);}assert.equal(s.tie.first,1);for(let i=0;i<6;i++){s=point(s,0);s=point(s,1);}s=point(s,0);assert.equal(s.sets.length,0);s=point(s,0);assert.deepEqual(s.sets[0].score,[7,6]);assert.deepEqual(s.sets[0].tiebreak,[8,6]);assert.equal(s.server,0);
});
test('match-deciding 10-point tiebreak replaces third set and needs a two-point lead',()=>{
 let s=createMatch({format:'match-tiebreak'});for(let i=0;i<6;i++)s=game(s,0);for(let i=0;i<6;i++)s=game(s,1);assert.equal(s.tie.kind,'match');assert.equal(s.tie.target,10);for(let i=0;i<9;i++){s=point(s,0);s=point(s,1);}s=point(s,0);assert.equal(s.winner,null);s=point(s,0);assert.equal(s.winner,0);assert.equal(s.sets[2].kind,'match');assert.deepEqual(s.sets[2].score,[11,9]);
});
test('tiebreak service/side context and completed-score validation',()=>{
 assert.deepEqual(Array.from({length:9},(_,i)=>tieServer(0,i)),[0,1,1,0,0,1,1,0,0]);
 assert.deepEqual(tiebreakSituation({a:3,b:3,first:0,target:7}),{winner:null,server:1,side:'Deuce (right)',changeNow:true,nextChange:12,nextSetServer:1});
 assert.equal(tiebreakSituation({a:7,b:5,first:0,target:7}).server,null);assert.equal(tiebreakSituation({a:7,b:6,first:0,target:7}).winner,null);
 assert.throws(()=>tiebreakSituation({a:8,b:2,first:0,target:7}));assert.throws(()=>tiebreakSituation({a:0,b:0,first:null,target:7}));assert.throws(()=>normalSituation({a:4,b:2,server:0}));assert.equal(normalSituation({a:4,b:3,server:1}).side,'Ad (left)');
});
test('only genuine completed result formats pass validation',()=>{
 assert.equal(validateResult({format:'best-three',names:['A','B'],sets:[{kind:'set',a:6,b:3},{kind:'set',a:7,b:6}]}).winner,0);
 assert.equal(validateResult({format:'match-tiebreak',sets:[{kind:'set',a:6,b:4},{kind:'set',a:3,b:6},{kind:'match',a:10,b:8}]}).winner,0);
 for(const sets of [[{kind:'set',a:6,b:5}],[{kind:'set',a:8,b:6}],[{kind:'set',a:6,b:3}],[{kind:'set',a:6,b:0},{kind:'set',a:6,b:0},{kind:'set',a:6,b:0}]])assert.throws(()=>validateResult({format:'best-three',sets}));
 assert.throws(()=>validateResult({format:'match-tiebreak',sets:[{kind:'set',a:6,b:3},{kind:'set',a:4,b:6},{kind:'match',a:12,b:8}]}));
});
test('match persistence validates replayable histories, not arbitrary stored score snapshots',()=>{
 const config=createMatch({format:'one-set'}).config;assert.ok(restoreMatch(JSON.stringify({version:1,config,history:[0,1,0]})));assert.equal(restoreMatch('{bad'),null);assert.equal(restoreMatch(JSON.stringify({version:1,config,history:[4]})),null);assert.equal(restoreMatch(JSON.stringify({version:2,config,history:[]})),null);
});
test('all bounded social schedules respect player, court, time and participation constraints',()=>{
 for(let n=4;n<=16;n++)for(const mode of ['singles','doubles'])for(let courts=1;courts<=Math.min(4,Math.floor(n/(mode==='singles'?2:4)));courts++)for(const duration of [30,70,120]){
  const input={names:Array.from({length:n},(_,i)=>`Player ${i+1}`),mode,courts,duration,round:10,changeover:2},s=schedule(input);assert.deepEqual(s,schedule(input));assert.ok(s.used<=duration);assert.equal(s.unused,duration-s.used);assert.ok(s.imbalance<=1);
  for(const r of s.rounds){const active=r.courts.flatMap(c=>c.teams.flat());assert.equal(new Set(active).size,active.length);assert.equal(active.length,courts*(mode==='singles'?2:4));assert.equal(active.length+r.rests.length,n);assert.ok(r.rests.every(p=>!active.includes(p)));assert.ok(r.end<=duration);}
  for(const t of s.totals)assert.equal(t.play+t.rest,s.rounds.length*10);
 }
 assert.throws(()=>schedule({names:['A','A','B','C'],mode:'doubles',courts:1,duration:60,round:10,changeover:2}));assert.equal(schedule({names:['A','B','C','D'],mode:'doubles',courts:2,duration:60,round:10,changeover:2}).activeCourts,1);
});
test('quiz answers are tied to the engine and ITF sections, not a certification claim',()=>{
 assert.equal(questions.length,100);assert.equal(new Set(questions.map(q=>q.id)).size,100);for(const q of questions){assert.ok(q.choices[q.answer]);assert.ok(q.explanation.length>30);assert.ok(q.source.startsWith('https://www.itftennis.com/'));assert.ok(q.rule);}
 const expected={'deuce':'Advantage A','advantage':'Deuce','tb-first':'A, deuce half','tb-three':'A, ad half','tb-six':'B serves from deuce; change ends if not already done','tb-margin':'No, the lead must be two','tb-next-set':'B','five-all':'No','seven-five':'7–5, set complete','odd-game':'Change ends'};
 questions.filter(q=>expected[q.id]).forEach(q=>assert.equal(q.choices[q.answer],expected[q.id]));assert.equal(tieServer(0,3),0);assert.equal(tiebreakSituation({a:3,b:3,first:0,target:7}).changeNow,true);
});
test('checklist safely restores plain text and rejects malformed records',()=>{const state=newChecklist();state.items.push({id:'custom',text:'<script>plain text</script>',done:true});assert.deepEqual(restoreChecklist(JSON.stringify(state)),state);assert.equal(restoreChecklist('{}'),null);assert.equal(restoreChecklist(JSON.stringify({version:1,items:[{id:'x',text:'',done:false}]})),null);});
