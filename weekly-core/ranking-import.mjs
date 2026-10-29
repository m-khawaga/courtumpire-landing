import {rankingColumns,playerIdentity,calculateChanges} from './rankings.mjs';
const official={atp:'https://www.atptour.com/en/rankings/singles',wta:'https://www.wtatennis.com/rankings/singles'};
const dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function prepareRankingImport(article,{tour,date,accessedAt,url,text,verified},previous=null){
 if(!official[tour])throw Error('Choose ATP or WTA singles.');
 if(!dateOK(date))throw Error('Ranking date: enter the actual official release date (YYYY-MM-DD).');
 if(!verified)throw Error('Confirm that you checked the release date, latest release available by cutoff, and all ten values against the official source.');
 const u=new URL(url);if(u.protocol!=='https:'||u.hostname!==new URL(official[tour]).hostname||u.pathname!==new URL(official[tour]).pathname||u.username||u.password)throw Error('Source: use the official published singles ranking URL, with its historical date query if available.');
 if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(accessedAt)||!Number.isFinite(Date.parse(accessedAt)))throw Error('Retrieved at: supply the actual timestamp with timezone offset.');
 const cutoff=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(article.coverageEnd));
 if(date>cutoff)throw Error('Ranking date is after this edition’s cutoff. Create a new edition instead of replacing its historical snapshot.');
 if(date>accessedAt.slice(0,10))throw Error('Ranking date cannot be later than retrieval.');
 if(Date.parse(accessedAt)>Date.parse(article.factsCheckedAt))throw Error('Retrieved at is after Facts checked. Update Facts checked honestly before importing newly reviewed evidence.');
 const lines=text.trim().split(/\r?\n/).filter(Boolean);if(lines.length!==10)throw Error('Paste exactly ten rows, without a header: Rank [tab] Player [tab] Points [tab] optional official profile URL.');
 const a=structuredClone(article),section=a.sections.find(s=>s.id==='rankings');if(!section)throw Error('Add the Rankings section first.');
 const sourceId=`manual-${tour}-${date}`,upsert=s=>{const i=a.sources.findIndex(x=>x.id===s.id);if(i<0)a.sources.push(s);else a.sources[i]=s;};
 upsert({id:sourceId,title:`${tour.toUpperCase()} official singles rankings — ${date}`,publisher:tour.toUpperCase(),url,publishedAt:date,accessedAt});
 const ids=new Set(),ranks=new Set();const rows=lines.map((line,index)=>{const cells=line.split('\t').map(s=>s.trim());if(cells.length<3||cells.length>4)throw Error(`Row ${index+1}: use three or four tab-separated cells.`);const [rank,player,points,profile]=cells;if(!/^(?:[1-9]|10)$/.test(rank)||ranks.has(rank))throw Error(`Row ${index+1}: ranks must be unique 1–10.`);ranks.add(rank);if(!player||player.length>150||/[<>]/.test(player))throw Error(`Row ${index+1}: enter a plain-text player name.`);if(!/^(?:0|[1-9]\d{0,7}|[1-9]\d{0,2}(?:,\d{3}){1,2})$/.test(points))throw Error(`Row ${index+1}: points must be a verified nonnegative integer.`);const sourceIds=[sourceId];if(profile){const identity=playerIdentity(profile,tour);if(!identity||ids.has(identity))throw Error(`Row ${index+1}: profile must have a unique official ${tour.toUpperCase()} player identifier.`);ids.add(identity);const id=`profile-${identity.replace(':','-')}`;upsert({id,title:player+' — official player profile',publisher:tour.toUpperCase(),url:profile,publishedAt:null,accessedAt});sourceIds.push(id);}return {cells:{rank,player,points,'rank-change':'N/A','points-change':'N/A'},sourceIds};}).sort((a,b)=>Number(a.cells.rank)-Number(b.cells.rank));
 const table={id:tour+'-top10',variant:'rankings',caption:`All ten ${tour.toUpperCase()} singles positions — official release ${date}`,scope:tour.toUpperCase()+' singles official world rankings',asOf:date,columns:structuredClone(rankingColumns),rows,sourceIds:[sourceId],note:ids.size<10?'Official player identity is missing for some rows; their comparisons remain N/A.':null};
 const index=section.tables.findIndex(t=>t.id===table.id);if(index<0)section.tables.push(table);else section.tables[index]=table;
 return calculateChanges(a,previous);
}
