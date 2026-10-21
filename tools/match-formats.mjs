// Website scoring formats. Document-only custom rules never change this engine contract.
export const matchFormats=Object.freeze({
  'one-set':{label:'One tie-break set (social format)',bestOf:1,games:6,tieAt:6,tieTarget:7,decider:'set'},
  'best-three':{label:'Best of 3 tie-break sets',bestOf:3,games:6,tieAt:6,tieTarget:7,decider:'set'},
  'match-tiebreak':{label:'Best of 3, deciding 10-point match tiebreak',bestOf:3,games:6,tieAt:6,tieTarget:7,decider:'match10'}
});
export const formats=Object.fromEntries(Object.entries(matchFormats).map(([id,f])=>[id,f.label]));
export const playerIds=['player-a','player-b'];
export const gamePresets=Object.freeze({6:{games:6,tieAt:6,tieTarget:7},4:{games:4,tieAt:4,tieTarget:7}});
export function formatDefinition(id,gamesPerSet=6){const f=matchFormats[id],preset=gamePresets[gamesPerSet];if(!f||!Number.isInteger(gamesPerSet)||!preset)throw new Error('Choose a supported match format and 4 or 6 games per set.');return {...f,...preset};}
export const formatLabel=(id,gamesPerSet=6)=>`${formatDefinition(id,gamesPerSet).label} · ${gamesPerSet}-game sets`;
export const gamesSelect=(name='gamesPerSet')=>`<label>Games per set<select name="${name}"><option value="6">6 games</option><option value="4">4 games</option></select></label>`;
export function setColumns(id){const f=formatDefinition(id);return Array.from({length:f.bestOf},(_,i)=>({kind:i===2&&f.decider==='match10'?'match':'set',label:i===2&&f.decider==='match10'?'Deciding match tiebreak':`Set ${i+1}`}));}
