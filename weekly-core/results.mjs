// One result record per concluded match. The article contract remains v1.
export const resultKey = cells => [(String(cells.tour||'').match(/ATP|WTA/)?.[0]||cells.tour)+' '+(/doubles/i.test(cells.tour)?'doubles':'singles'),cells.tournament,cells.round,...[cells.winner,cells.opponent].sort()].map(v=>String(v??'').normalize('NFKC').toLowerCase().trim()).join('|');
export const resultRows = a => a.sections.flatMap(s=>s.tables.filter(t=>t.variant==='results').flatMap(t=>t.rows));
export function resultsErrors(a){
  const errors=[],seen=new Set(),rows=resultRows(a),fail=(path,message)=>errors.push({path,message});
  for(const [i,r] of rows.entries()) {const key=resultKey(r.cells);if(seen.has(key))fail('results.rows['+i+']','Duplicate match across results tables; keep one canonical record.');seen.add(key);}
  const t=a.sections.find(s=>s.id==='results')?.tables.find(t=>t.id==='weekly-singles');if(!t)return errors;
  const audit=a.sections.find(s=>s.id==='results').tables.find(t=>t.id==='results-coverage');
  if(!audit)fail('results-coverage','Weekly singles requires a tournament coverage ledger, including unavailable events.');
  const dateInZone=v=>new Intl.DateTimeFormat('en-CA',{timeZone:a.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
  const start=dateInZone(a.coverageStart),end=dateInZone(a.coverageEnd);
  for(const [i,r]of t.rows.entries()){
    const c=r.cells,p='weekly-singles.rows['+i+']';
    if(!/^(ATP|WTA)$/.test(c.tour)||!/^(250|500|1000|Grand Slam|Finals)$/.test(c.category||''))fail(p,'Use ATP or WTA and a verified main-tour category in the category column.');
    if(/qualif|challenger|itf|doubles/i.test(c.round+' '+c.category))fail(p,'Weekly singles excludes qualifying, Challenger, ITF and doubles.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||c.date<start||c.date>end)fail(p+'.date','Match date must lie within the edition coverage dates.');
    if(c.date===start||c.date===end){if(!c['completed-at']||!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(c['completed-at'])||!Number.isFinite(Date.parse(c['completed-at'])))fail(p+'.completed-at','Boundary-day matches require a sourced completion timestamp with offset; otherwise hold them out and explain the coverage gap.');}
    if(c['completed-at']&&c['completed-at']!=='N/A'&&(Date.parse(c['completed-at'])<Date.parse(a.coverageStart)||Date.parse(c['completed-at'])>=Date.parse(a.coverageEnd)))fail(p+'.completed-at','Completion falls outside the exact edition window.');
  }
  if(audit){const names=new Set();for(const [i,r]of audit.rows.entries()){const c=r.cells,p='results-coverage.rows['+i+']',key=c.tour+'|'+c.tournament;names.add(key);const count=t.rows.filter(r=>r.cells.tour===c.tour&&r.cells.tournament===c.tournament).length;if(!['complete','incomplete','unavailable'].includes(c.status))fail(p+'.status','Use complete, incomplete or unavailable.');if(c['verified-count']!==String(count))fail(p+'.verified-count','Verified count must equal '+count+' included matches.');if(c.status!=='complete'&&!c.note?.trim())fail(p+'.note','Explain the remaining coverage gap.');}for(const r of t.rows)if(!names.has(r.cells.tour+'|'+r.cells.tournament))fail('results-coverage','Every included tournament needs a coverage row.');if(audit.rows.some(r=>r.cells.status!=='complete')&&/\ball\b/i.test(t.caption))fail('weekly-singles.caption','Incomplete coverage cannot be labelled all results.');}
  return errors;
}
