// Uses existing v1 table cells and source URLs; no new article properties.
export const tours=[{id:'atp',label:'Men — ATP singles top 10',readerLabel:'Men’s Top 10 · ATP'},{id:'wta',label:'Women — WTA singles top 10',readerLabel:'Women’s Top 10 · WTA'}];
export const rankingColumns=[{key:'rank',label:'Rank'},{key:'player',label:'Player'},{key:'points',label:'Points'},{key:'rank-change',label:'Rank change'},{key:'points-change',label:'Points change'}];
export function playerIdentity(url,tour){try{const u=new URL(url);if(u.protocol!=='https:')return null;let m;if(tour==='atp'&&['www.atptour.com','atptour.com'].includes(u.hostname)&&(m=u.pathname.match(/^\/en\/players\/[^/]+\/([a-z0-9]{4})(?:\/|$)/i)))return 'atp:'+m[1].toLowerCase();if(tour==='wta'&&['www.wtatennis.com','wtatennis.com'].includes(u.hostname)&&(m=u.pathname.match(/^\/players\/(\d+)(?:\/|$)/)))return 'wta:'+m[1];return null;}catch{return null;}}
export function identityFor(row,edition,tour){const ids=[...new Set(row.sourceIds.map(id=>playerIdentity(edition.sources.find(s=>s.id===id)?.url,tour)).filter(Boolean))];return ids.length===1?ids[0]:null;}
const numeric=value=>typeof value==='string'&&/^(?:0|[1-9]\d{0,8}|[1-9]\d{0,2}(?:,\d{3})+)$/.test(value)?Number(value.replaceAll(',','')):null;
function evidence(row,edition,tour){return row.sourceIds.some(id=>{const s=edition.sources.find(s=>s.id===id);if(!s)return false;try{const u=new URL(s.url);return tour==='atp'?['www.atptour.com','atptour.com'].includes(u.hostname)&&/^\/en\/rankings\/singles(?:\/|$)/.test(u.pathname):['www.wtatennis.com','wtatennis.com'].includes(u.hostname)&&/^\/rankings\/singles(?:\/|$)/.test(u.pathname);}catch{return false;}});}
export const tableFor=(a,tour,id='top10')=>a.sections.find(s=>s.id==='rankings')?.tables.find(t=>t.id===tour+'-'+id);
function snapTable(a,tour){const t=tableFor(a,tour);if(!t)return {asOf:null,complete:false,rows:[]};const rows=t.rows.map(r=>({identity:identityFor(r,a,tour),name:r.cells.player,sourceReferences:r.sourceIds.map(id=>a.sources.find(s=>s.id===id)).filter(Boolean),rank:t.asOf&&evidence(r,a,tour)?numeric(r.cells.rank):null,points:t.asOf&&evidence(r,a,tour)?numeric(r.cells.points):null}));return {asOf:t.asOf,rows,complete:rows.length===10&&new Set(rows.map(r=>r.rank)).size===10&&rows.every(r=>r.rank>=1&&r.rank<=10&&r.points!==null&&r.identity)&&new Set(rows.map(r=>r.identity)).size===10};}
export function snapshot(a){return {id:a.id,slug:a.slug,title:a.title,editionNumber:a.editionNumber,tables:Object.fromEntries(tours.map(t=>[t.id,snapTable(a,t.id)]))};}
export function changeText(value,unit){return value===null?'N/A':value===0?'0 (unchanged)':`${value>0?'↑':'↓'} ${Math.abs(value)} (${value>0?'up':'down'} ${Math.abs(value)} ${Math.abs(value)===1?unit.replace(/s$/,''):unit})`;}
// Verified 26 October singles rankings for the November 6 comparison.
// The first published edition lacked profile IDs. Alcaraz and Shelton's printed
// points also differ from the archived release. Jodar was just outside the Top 10.
// Evidence: October edition, dated ATP/WTA snapshots, cross-checked October
// ATP figures (oct-cross and oct-euro in cu-weekly-2026-11-06).
const octoberComparison = {
  'atp:z355': { name: 'Alexander Zverev', rank: 2, points: 9750, printed: 9750 },
  'atp:s0ag': { name: 'Jannik Sinner', rank: 1, points: 10450, printed: 10450 },
  'atp:a0e2': { name: 'Carlos Alcaraz', rank: 3, points: 5610, printed: 6610 },
  'atp:s0s1': { name: 'Ben Shelton', rank: 4, points: 4680, printed: 4690 },
  'atp:mm58': { name: 'Daniil Medvedev', rank: 5, points: 3860, printed: 3860 },
  'atp:c0e9': { name: 'Flavio Cobolli', rank: 6, points: 3690, printed: 3690 },
  'atp:f0f1': { name: 'Arthur Fils', rank: 8, points: 3425, printed: 3425 },
  'atp:td51': { name: 'Frances Tiafoe', rank: 9, points: 3380, printed: 3380 },
  'atp:dh58': { name: 'Alex de Minaur', rank: 10, points: 3280, printed: 3280 },
  'atp:j0dz': { name: 'Rafael Jodar', rank: 11, points: 3234, printed: 3234 },
  'wta:324166': { name: 'Elena Rybakina', rank: 1, points: 9501, printed: 9501 },
  'wta:320760': { name: 'Aryna Sabalenka', rank: 2, points: 7550, printed: 7550 },
  'wta:331809': { name: 'Mirra Andreeva', rank: 3, points: 6306, printed: 6306 },
  'wta:328560': { name: 'Coco Gauff', rank: 5, points: 5973, printed: 5973 },
  'wta:316956': { name: 'Jessica Pegula', rank: 4, points: 6225, printed: 6225 },
  'wta:316738': { name: 'Elina Svitolina', rank: 6, points: 5229, printed: 5229 },
  'wta:322191': { name: 'Karolina Muchova', rank: 7, points: 4725, printed: 4725 },
  'wta:329668': { name: 'Linda Noskova', rank: 9, points: 4353, printed: 4353 },
  'wta:326408': { name: 'Iga Swiatek', rank: 8, points: 4389, printed: 4389 },
  'wta:326482': { name: 'Marta Kostyuk', rank: 10, points: 3920, printed: 3920 },
};

function novemberPreviousRow(article, previous, tour, identity) {
  if (article.id !== 'cu-weekly-2026-11-06' || previous?.id !== 'cu-weekly-2026-10-30') return null;
  const old = previous.tables?.[tour];
  if (old?.asOf !== '2026-10-26' || old.rows?.length !== 10) return null;
  const verified = octoberComparison[identity];
  if (!verified) return null;
  if (verified.rank === 11) {
    return old.rows.some(row => row.name === verified.name) ? null : verified;
  }
  const printed = old.rows.find(row => row.rank === verified.rank);
  if (printed?.identity || printed?.name !== verified.name) return null;
  return [verified.printed, verified.points].includes(printed.points) ? verified : null;
}

export function comparisonRows(a,tour,previous){const current=snapTable(a,tour),old=previous?.tables?.[tour],baseline=tableFor(a,tour,'comparison-baseline');return current.rows.map((row,index)=>{
  const warnings=[];let before=null,newToTop10=false;
  if(!row.identity)warnings.push('Player identity unavailable — comparison N/A; review the official profile source.');
  if(row.rank===null||row.points===null)warnings.push('Current values lack a dated official ranking source; verify the source content, not just its URL.');
  if(previous&&row.identity){const matches=old?.rows.filter(r=>r.identity===row.identity)||[];if(matches.length===1)before=matches[0];else if(matches.length>1)warnings.push('Previous identity is ambiguous — comparison N/A.');else{
    before=novemberPreviousRow(a,previous,tour,row.identity);
    newToTop10=!!old?.complete;
    if(baseline&&old?.asOf&&baseline.asOf===old.asOf){const matches=baseline.rows.filter(r=>identityFor(r,a,tour)===row.identity&&evidence(r,a,tour));if(matches.length===1)before={rank:numeric(matches[0].cells.rank),points:numeric(matches[0].cells.points)};}
  }}
  if(previous&&!before)warnings.push('Previous snapshot values unavailable. No rank or points assumed.');
  const rank=before?.rank!==null&&before?.rank!==undefined&&row.rank!==null?before.rank-row.rank:null,points=before?.points!==null&&before?.points!==undefined&&row.points!==null?row.points-before.points:null;
  return {...row,index,newToTop10,warnings,rankChange:changeText(rank,'places'),pointsChange:changeText(points,'points')};
});}
export function rankingErrors(a,previous){const errors=[];for(const tour of tours){const t=tableFor(a,tour.id);if(!t){errors.push({path:'sections.rankings.tables',message:'Add '+tour.id+'-top10, including an explicit missing-data explanation if unavailable.'});continue;}const expected=rankingColumns.map(c=>c.key);if(JSON.stringify(t.columns.map(c=>c.key))!==JSON.stringify(expected))errors.push({path:'tables.'+t.id+'.columns',message:'Use Rank, Player, Points, Rank change, Points change in that order.'});const rows=comparisonRows(a,tour.id,previous);for(const r of rows)for(const [key,value]of [['rank-change',r.rankChange],['points-change',r.pointsChange]])if(t.rows[r.index].cells[key]!==value)errors.push({path:`tables.${t.id}.rows[${r.index}].cells.${key}`,message:`Expected “${value}” against ${previous?.id||'unavailable previous baseline'}. Use Calculate ranking changes.`});if((t.rows.length!==10||!t.asOf||rows.some(r=>r.rank===null||r.points===null))&&!t.note)errors.push({path:'tables.'+t.id+'.note',message:'Explain missing or unverified ranking data.'});if(t.rows.length>10)errors.push({path:'tables.'+t.id+'.rows',message:'Top 10 tables contain at most ten players.'});const known=rows.map(r=>r.identity).filter(Boolean);if(new Set(known).size!==known.length)errors.push({path:'tables.'+t.id+'.rows',message:'Duplicate verified player identity.'});const ranks=rows.map(r=>r.rank).filter(r=>r!==null);if(new Set(ranks).size!==ranks.length||ranks.some(r=>r<1||r>10))errors.push({path:'tables.'+t.id+'.rows',message:'Verified current ranks must be unique positions 1–10.'});}return errors;}
export function calculateChanges(a,previous){for(const tour of tours){const t=tableFor(a,tour.id);if(!t)continue;for(const row of comparisonRows(a,tour.id,previous)){t.rows[row.index].cells['rank-change']=row.rankChange;t.rows[row.index].cells['points-change']=row.pointsChange;}if(previous&&t.note)t.note=t.note.replace(/First edition — no comparison\.?\s*/g,'').trim()||null;if(!previous&&!t.note)t.note='Previous published baseline unavailable — comparisons N/A.';}return a;}
export function comparisonFor(a,publishedSnapshots,history){if(history&&Object.hasOwn(history.comparisons,a.id)){const key=history.comparisons[a.id];if(!key)return null;const saved=history.snapshots[key],live=publishedSnapshots.find(s=>s.id===saved.id);return {...saved,slug:live?.slug||saved.slug,unpublished:!live};}return publishedSnapshots.filter(s=>s.id!==a.id&&(a.editionNumber?s.editionNumber<a.editionNumber:s.id<a.id)).sort((a,b)=>b.editionNumber-a.editionNumber)[0]||null;}

export function rankingReview(a,previous){return tours.flatMap(tour=>{const table=tableFor(a,tour.id);if(!table)return [];return table.rows.map((row,i)=>({tour:tour.label,player:row.cells.player,index:i,issues:[...(!table.asOf||!evidence(row,a,tour.id)?['Current snapshot: no dated official ranking source is referenced. Secondary figures require explicit attribution.']:['Current snapshot: official source URL supplied; manually verify its content, date, rank and points. URL shape is not verification.']),...(!identityFor(row,a,tour.id)?['Identity: a unique official profile identifier is unavailable. Comparison must remain N/A.']:['Identity: official profile identifier found; confirm the profile belongs to this player.']),...(!previous?['Baseline: no previous published edition established. Do not assume this is the first edition.']:comparisonRows(a,tour.id,previous)[i].warnings)],sources:row.sourceIds.map(id=>a.sources.find(s=>s.id===id)).filter(Boolean)}));});}
