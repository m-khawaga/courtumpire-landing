// Bounded deterministic greedy social rotations, not a round-robin or optimality solver.
import {roundPlan} from './schedule-settings.mjs';
function combinations(values,n){if(n===0)return [[]];const out=[];for(let i=0;i<=values.length-n;i++)for(const tail of combinations(values.slice(i+1),n-1))out.push([values[i],...tail]);return out;}
const pairKey=(a,b)=>[a,b].sort((a,b)=>a-b).join(':');
export function schedule({names,mode,courts,duration,round,changeover,planningMode='duration',roundCount,preference='maximize'}) {
  const minimum=mode==='singles'?2:4;
  if(!Array.isArray(names)||names.length<minimum||names.length>32||names.some(n=>typeof n!=='string'||!n.trim()||Array.from(n).length>60)||new Set(names.map(n=>n.trim().toLocaleLowerCase())).size!==names.length)throw new Error(`Enter ${minimum}–32 distinct names for ${mode==='singles'?'singles':'doubles'}, up to 60 characters each.`);
  if(!['singles','doubles'].includes(mode)||!Number.isInteger(courts)||courts<1||courts>8)throw new Error('Choose singles or doubles and 1–8 courts.');
  if(!['maximize','rest'].includes(preference))throw new Error('Choose maximize playing time or include rest rounds.');
  const perCourt=mode==='singles'?2:4,maxActive=Math.min(courts,Math.floor(names.length/perCourt));
  if(maxActive<1)throw new Error(`At least ${perCourt} players are needed for one complete ${mode} court.`);
  const activeCourts=preference==='rest'&&maxActive*perCourt===names.length&&maxActive>1?maxActive-1:maxActive,capacity=activeCourts*perCourt;
  const timing=roundPlan({duration,round,changeover,planningMode,roundCount}),count=timing.rounds.length;duration=timing.duration;
  const played=names.map(()=>0),last=names.map(()=>-1),partners=new Map(),opponents=new Map(),rounds=[];
  for(let r=0;r<count;r++){
    // Always prioritise the least-used players, then the longest wait, then stable identity.
    let pool=names.map((_,i)=>i).sort((a,b)=>played[a]-played[b]||last[a]-last[b]||a-b).slice(0,capacity);
    const assignments=[];
    for(let c=0;c<activeCourts;c++){
      let best=null,bestCost=Infinity;
      for(const tail of combinations(pool.slice(1),perCourt-1)){
        const group=[pool[0],...tail];
        const layouts=perCourt===2?[[[group[0]],[group[1]]]]:[[[group[0],group[1]],[group[2],group[3]]],[[group[0],group[2]],[group[1],group[3]]],[[group[0],group[3]],[group[1],group[2]]]];
        for(const teams of layouts){let cost=0;for(const t of teams)if(t.length===2)cost+=6*(partners.get(pairKey(...t))||0);for(const a of teams[0])for(const b of teams[1])cost+=opponents.get(pairKey(a,b))||0;if(cost<bestCost){bestCost=cost;best=teams;}}
      }
      assignments.push({court:c+1,teams:best});const used=best.flat();pool=pool.filter(i=>!used.includes(i));
      for(const t of best)if(t.length===2){const k=pairKey(...t);partners.set(k,(partners.get(k)||0)+1);}for(const a of best[0])for(const b of best[1]){const k=pairKey(a,b);opponents.set(k,(opponents.get(k)||0)+1);}
    }
    const active=assignments.flatMap(c=>c.teams.flat());active.forEach(i=>{played[i]++;last[i]=r;});
    rounds.push({number:r+1,start:r*(round+changeover),end:r*(round+changeover)+round,courts:assignments,rests:names.map((_,i)=>i).filter(i=>!active.includes(i))});
  }
  const used=rounds.at(-1).end;
  return {version:1,names:names.map(n=>n.trim()),mode,courts,activeCourts,preference,planningMode,duration,round,changeover,rounds,used,unused:duration-used,equalParticipationPossible:(count*capacity)%names.length===0,totals:names.map((name,i)=>({name,play:played[i]*round,rest:(count-played[i])*round,restRounds:count-played[i],rounds:played[i]})),imbalance:Math.max(...played)-Math.min(...played),repeatedPartners:[...partners.values()].reduce((n,v)=>n+Math.max(0,v-1),0),repeatedOpponents:[...opponents.values()].reduce((n,v)=>n+Math.max(0,v-1),0)};
}
export function scheduleSummary(s){return `CourtUmpire social rotations · ${s.mode} · ${s.used}/${s.duration} min\n`+s.rounds.map(r=>`Round ${r.number} (${r.start}–${r.end} min): `+r.courts.map(c=>`Court ${c.court}: ${c.teams.map(t=>t.map(i=>s.names[i]).join(' + ')).join(' vs ')}`).join('; ')+`; Rest: ${r.rests.map(i=>s.names[i]).join(', ')||'none'}`).join('\n')+`\nUnused time: ${s.unused} min. Participation spread: ${s.imbalance} round(s).`;}
