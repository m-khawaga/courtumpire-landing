// Explicit legacy-generator compatibility. Never discard values or guess aliases.
export function normalizeGeneratedArticle(input){
  const article=structuredClone(input),changes=[];
  for(const [si,section] of (article.sections||[]).entries())for(const [ti,table] of (section.tables||[]).entries()){
    const aliases=table.variant==='rankings'?{rankChange:'rank-change',pointsChange:'points-change'}:table.variant==='player-updates'?{issue:'reported-issue',announcementDate:'announcement-date',returnStatus:'return-status'}:table.variant==='schedule'?{stage:'status'}:{};
    for(const [old,required] of Object.entries(aliases)){
      if(!table.columns.some(c=>c.key===old)&&!table.rows.some(r=>Object.hasOwn(r.cells,old)))continue;
      if(table.columns.some(c=>c.key===required)||table.rows.some(r=>Object.hasOwn(r.cells,required)))throw Error(`Conflicting ${old}/${required} in ${table.id}; resolve without discarding either value.`);
      for(const c of table.columns)if(c.key===old)c.key=required;
      for(const r of table.rows)if(Object.hasOwn(r.cells,old)){r.cells=Object.fromEntries(Object.entries(r.cells).map(([k,v])=>[k===old?required:k,v]));}
      changes.push({path:`sections[${si}].tables[${ti}]`,table:table.id,from:old,to:required});
    }
  }
  return {article,changes};
}
