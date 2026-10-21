// Pure singles scoring. Sources: ITF 2026 Rules 5–7, 10, 14, 17 and Appendix VI.
export const RULES_URL='https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf';
import {formats,formatDefinition,playerIds} from './match-formats.mjs';
export {formats} from './match-formats.mjs';
export function cleanName(value,fallback='Player') { const s=String(value??'').trim();return s?Array.from(s).slice(0,60).join(''):fallback; }
export function createMatch(config={}) {
  if(!Object.hasOwn(formats,config.format||'best-three')||![0,1].includes(config.first??0))throw new Error('Choose a supported format and first server.');
  const gamesPerSet=config.gamesPerSet??6;formatDefinition(config.format||'best-three',gamesPerSet);
  return {version:1,config:{format:config.format||'best-three',gamesPerSet,first:config.first??0,names:[cleanName(config.names?.[0],'Player A'),cleanName(config.names?.[1],'Player B')]},games:[0,0],points:[0,0],sets:[],server:config.first??0,tie:null,winner:null,changeEnds:false,event:'Ready for the first point.'};
}
export function tieServer(first,played) {if(![0,1].includes(first)||!Number.isInteger(played)||played<0)throw new Error('A first server and a non-negative point count are required.');return played===0?first:(Math.floor((played+1)/2)%2?1-first:first);}
export function tieWinner(points,target=7) {return Math.max(...points)>=target&&Math.abs(points[0]-points[1])>=2?(points[0]>points[1]?0:1):null;}
export function validTieScore(a,b,target) {
  if(![7,10].includes(target)||![a,b].every(n=>Number.isInteger(n)&&n>=0&&n<=999))return false;
  const hi=Math.max(a,b),lo=Math.min(a,b);
  if(tieWinner([a,b],target)===null)return true;
  return (hi===target&&lo<=target-2)||(hi>target&&lo===hi-2&&lo>=target-1);
}
export function gameLabel(points) {
  const [a,b]=points;
  if(a>=3&&b>=3)return a===b?['40','40']:a>b?['AD','40']:['40','AD'];
  return points.map(n=>['0','15','30','40'][Math.min(n,3)]);
}
export function setWins(state) {return [0,1].map(p=>state.sets.filter(s=>s.winner===p).length);}
function finishSet(s,winner,record) {
  s.sets.push({...record,winner});s.games=[0,0];s.points=[0,0];s.tie=null;
  const wins=setWins(s), needed=s.config.format==='one-set'?1:2;
  if(wins[winner]>=needed){s.winner=winner;s.event=`${s.config.names[winner]} wins the match.`;return;}
  if(s.config.format==='match-tiebreak'&&wins[0]===1&&wins[1]===1)s.tie={first:s.server,target:10,kind:'match'};
}
export function point(state,winner) {
  if(![0,1].includes(winner))throw new Error('Choose a point winner.');
  if(state.winner!==null)return state;
  const s=structuredClone(state);s.changeEnds=false;s.points[winner]++;
  const g=formatDefinition(s.config.format,s.config.gamesPerSet??6).games;
  if(s.tie) {
    const t=s.tie,n=s.points[0]+s.points[1],w=tieWinner(s.points,t.target);
    s.server=tieServer(t.first,n);s.changeEnds=n%6===0;s.event=s.changeEnds?'Change ends now (standard six-point tiebreak rule).':'Tiebreak in progress.';
    if(w!==null){s.server=1-t.first;const record=t.kind==='match'?{kind:'match',score:[...s.points]}:{kind:'set',score:w===0?[g+1,g]:[g,g+1],tiebreak:[...s.points]};s.changeEnds=t.kind==='set'||n%6===0;s.event='Tiebreak complete. The first tiebreak receiver serves first in the next set, if any.';finishSet(s,w,record);}
    return s;
  }
  const [a,b]=s.points;
  if(Math.max(a,b)>=4&&Math.abs(a-b)>=2) {
    s.games[winner]++;s.points=[0,0];s.server=1-s.server;
    s.changeEnds=(s.games[0]+s.games[1])%2===1;s.event=s.changeEnds?'Game complete. Change ends.':'Game complete. Keep your court ends.';
    if(Math.max(...s.games)>=g&&Math.abs(s.games[0]-s.games[1])>=2){const score=[...s.games];finishSet(s,winner,{kind:'set',score});}
    else if(s.games[0]===g&&s.games[1]===g){s.tie={first:s.server,target:7,kind:'set'};s.event=`${g}–${g}: start a 7-point tiebreak, win by two.`;}
  } else s.event=a>=3&&b>=3?(a===b?'Deuce. Win two consecutive points.':`Advantage ${s.config.names[winner]}.`):'Point recorded.';
  return s;
}
export function replayMatch(config,history) {
  if(!Array.isArray(history)||history.length>5000||history.some(p=>![0,1].includes(p)))throw new Error('Invalid saved point history.');
  let s=createMatch(config);
  for(const p of history){if(s.winner!==null)throw new Error('Saved history continues after match completion.');s=point(s,p);}
  return s;
}
export function restoreMatch(raw) {try{const r=JSON.parse(raw);if(r?.version!==1)return null;return {config:replayMatch(r.config,r.history).config,history:r.history};}catch{return null;}}
export function tiebreakSituation({a,b,first,target}) {
  if(![0,1].includes(first))throw new Error('Select who served the first tiebreak point; the score alone cannot establish service order.');
  if(!validTieScore(a,b,target))throw new Error('Enter a possible tiebreak score, from 0 to 999. A completed tiebreak must stop when its winning margin is first reached.');
  const n=a+b,w=tieWinner([a,b],target);
  return {winner:w,server:w===null?tieServer(first,n):null,side:n%2===0?'Deuce (right)':'Ad (left)',changeNow:n>0&&n%6===0,nextChange:n+(6-n%6),nextSetServer:1-first};
}
export function normalSituation({a,b,server}) {
  if(![a,b].every(n=>Number.isInteger(n)&&n>=0&&n<=4)||![0,1].includes(server)||a===4&&b!==3||b===4&&a!==3)throw new Error('Use a valid current game score; advantage requires the other player to be at 40. Select the current server.');
  return {server,side:(a+b)%2===0?'Deuce (right)':'Ad (left)',label:gameLabel([a,b]),nextGameServer:1-server};
}
export function validateResult(input) {
  const {format,sets}=input,gamesPerSet=input.gamesPerSet??6,g=formatDefinition(format,gamesPerSet).games;
  const names=[cleanName(input.names?.[0],'Player A'),cleanName(input.names?.[1],'Player B')];
  const fail=(message,index,fields=['a','b'])=>{const error=new Error(message);error.setIndex=index;error.fields=fields;throw error;};
  if(!Object.hasOwn(formats,format)||!Array.isArray(sets)||!sets.length||sets.length>3)throw new Error('Enter the completed sets for a supported format.');
  const wins=[0,0],needed=Math.ceil(formatDefinition(format).bestOf/2);
  for(let i=0;i<sets.length;i++){
    if(Math.max(...wins)>=needed)fail(`${names[wins[0]>wins[1]?0:1]} has already won after Set ${i}. Clear Set ${i+1} or correct the earlier scores.`,i,['a','b']);
    const {a,b,kind,tiebreak}=sets[i];if(![a,b].every(n=>Number.isInteger(n)&&n>=0&&n<=999))fail(`Set ${i+1}: enter whole, non-negative scores.`,i);
    if(kind==='match'){
      if(format!=='match-tiebreak'||i!==2||wins[0]!==1||wins[1]!==1||!validTieScore(a,b,10)||tieWinner([a,b],10)===null)fail('The deciding match tiebreak must follow one set each, reach at least 10 points and finish at its first two-point winning margin.',i);
      if(tiebreak)fail('Enter deciding match-tiebreak points as the main score, not as set-tiebreak details.',i,['ta','tb']);
    } else {
      if(kind!=='set'||format==='match-tiebreak'&&i===2)fail('Use a deciding match tiebreak in this format.',i);
      const hi=Math.max(a,b),lo=Math.min(a,b);if(!((hi===g&&lo<=g-2)||(hi===g+1&&(lo===g-1||lo===g))))fail(`Set ${i+1} is incomplete or impossible: use ${g}–0 through ${g}–${g-2}, ${g+1}–${g-1} or ${g+1}–${g} (or reversed).`,i);
      if(tiebreak){
        if(hi!==g+1||lo!==g)fail(`Set ${i+1}: tiebreak points belong only to a ${g+1}–${g} or ${g}–${g+1} set. Clear the details or correct the games.`,i,['ta','tb']);
        if(!Array.isArray(tiebreak)||tiebreak.length!==2||!validTieScore(...tiebreak,7)||tieWinner(tiebreak,7)===null)fail(`Set ${i+1}: enter both completed tiebreak scores, at least 7 points and won by two.`,i,['ta','tb']);
        if((tiebreak[0]>tiebreak[1])!==(a>b))fail(`Set ${i+1}: the tiebreak winner must match the ${g+1}–${g} set winner.`,i,['ta','tb']);
      }
    }
    wins[a>b?0:1]++;
  }
  if(Math.max(...wins)!==needed)throw new Error('The match is not complete in this format. Enter the remaining set; retired and incomplete results cannot be exported as a completed win.');
  return {names,format,gamesPerSet,sets:sets.map(s=>({...s})),winner:wins[0]>wins[1]?0:1};
}
export function completedResult(state){
  if(state.winner===null)throw new Error('Finish the match before creating its result card.');
  return validateResult({names:state.config.names,format:state.config.format,gamesPerSet:state.config.gamesPerSet??6,sets:state.sets.map(s=>({kind:s.kind,a:s.score[0],b:s.score[1],...(s.tiebreak?{tiebreak:[...s.tiebreak]}:{})}))});
}
export {playerIds};
