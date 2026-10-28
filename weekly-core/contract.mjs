import {resultsErrors} from './results.mjs';
import {rankingColumns,tours,tableFor} from './rankings.mjs';
// The shared courtumpire-weekly/v1 contract. No alternate editor format.
const text = (max=4000,min=1) => ({type:'string',minLength:min,maxLength:max});
const nullable = value => ({anyOf:[value,{type:'null'}]});
const list = (items,max=100) => ({type:'array',items,maxItems:max});
const choice = (...values) => ({enum:values});
const obj = properties => ({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const date = {type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'};
const stamp = {type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2})$'};
const key = {type:'string',pattern:'^[a-z][a-z0-9-]{0,79}$'};
const refs = list(key,30);
const url = {type:'string',maxLength:2000,pattern:'^https://[^\\s]+$'};
const row = obj({cells:{type:'object',additionalProperties:text(500)},sourceIds:refs});
const table = obj({id:key,variant:choice('results','rankings','player-updates','schedule','general'),caption:text(400),scope:text(400),asOf:nullable(date),columns:{...list(obj({key,label:text(80)}),12),minItems:1},rows:list(row,1500),sourceIds:refs,note:nullable(text())});
const reveal = obj({label:text(150),question:text(500),options:{...list(obj({id:key,text:text(500)}),4),minItems:2},answerOptionId:key,explanation:text(),sourceIds:refs});
const video = obj({title:text(250),url,provider:choice('youtube','external'),channel:text(150),publishedAt:nullable({anyOf:[date,stamp]}),embedAllowed:{type:'boolean'},rightsStatus:choice('verified-official-embed','owned','licensed','link-only'),rightsNote:text(1000),sourceIds:refs});
export const sectionOrder=['last-week','opening','at-a-glance','turning-point','results','rankings','player-watch','incidents','watch','this-weekend','next-week'];
export const requiredSections=['opening','at-a-glance','results','rankings','this-weekend','next-week'];
const section=obj({id:choice(...sectionOrder),heading:text(200),paragraphs:list(obj({text:text(),kind:choice('fact','analysis','editorial'),sourceIds:refs}),30),tables:list(table,10),timeline:list(obj({label:text(150),text:text(),sourceIds:refs}),5),reveal:nullable(reveal),videos:list(video,5)});
export const schema={ $schema:'https://json-schema.org/draft/2020-12/schema', $id:'https://courtumpire.com/schemas/courtumpire-weekly-v1.json', ...obj({schemaVersion:{const:'courtumpire-weekly/v1'},id:{type:'string',pattern:'^cu-weekly-\\d{4}-\\d{2}-\\d{2}$'},slug:{type:'string',maxLength:120,pattern:'^\\d{4}-\\d{2}-\\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$'},editionNumber:nullable({type:'integer',minimum:1}),status:choice('draft','published'),title:text(180),deck:text(500),language:{const:'en'},timezone:{const:'Europe/Berlin'},issueDate:date,coverageStart:stamp,coverageEnd:stamp,plannedCutoff:stamp,factsCheckedAt:stamp,publishedAt:nullable(stamp),updatedAt:nullable(stamp),authorLabel:text(100),aiAssisted:{type:'boolean'},seoDescription:text(300),tags:list(text(40),12),commentsEnabled:{type:'boolean'},reactionsEnabled:{type:'boolean'},sources:list(obj({id:key,title:text(300),publisher:text(150),url,publishedAt:nullable({anyOf:[date,stamp]}),accessedAt:stamp}),100),sections:{...list(section,12),minItems:6},corrections:list(obj({at:stamp,note:text(),sourceIds:refs}),50)})};

// Small dependency-free interpreter for this schema, shared by browser and CLI.
function check(s,v,p,errors){
  const fail=m=>errors.push({path:p,message:m});
  if(s.anyOf){if(!s.anyOf.some(a=>{const e=[];check(a,v,p,e);return !e.length;}))fail('Must match the expected type or be null.');return;}
  if('const' in s&&v!==s.const)fail('Must be '+s.const+'.');
  if(s.enum&&!s.enum.includes(v))fail('Choose '+s.enum.join(', ')+'.');
  if(s.type){const valid=s.type==='null'?v===null:s.type==='array'?Array.isArray(v):s.type==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):s.type==='integer'?Number.isSafeInteger(v):typeof v===s.type;if(!valid){fail('Expected '+s.type+'.');return;}}
  if(typeof v==='string'){if(s.minLength&&v.trim().length<s.minLength)fail('Required text is missing.');if(v.length>s.maxLength)fail('Maximum '+s.maxLength+' characters.');if(s.pattern&&!new RegExp(s.pattern).test(v))fail('Invalid format.');}
  if(typeof v==='number'&&s.minimum&&v<s.minimum)fail('Must be at least '+s.minimum+'.');
  if(Array.isArray(v)){if(v.length<(s.minItems||0)||v.length>(s.maxItems??Infinity))fail('Wrong number of items.');v.forEach((x,i)=>check(s.items,x,p+'['+i+']',errors));}
  if(s.type==='object'){for(const k of s.required||[])if(!Object.hasOwn(v,k))errors.push({path:p+'.'+k,message:'Required field is missing.'});for(const k of Object.keys(v)){if(s.properties?.[k])check(s.properties[k],v[k],p+'.'+k,errors);else if(s.additionalProperties===false)errors.push({path:p+'.'+k,message:'Unknown field.'});else if(typeof s.additionalProperties==='object')check(s.additionalProperties,v[k],p+'.'+k,errors);}}
}
export function youtubeId(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.youtube.com'&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||'')&&[...u.searchParams.keys()].every(k=>k==='v')?u.searchParams.get('v'):null;}catch{return null;}}
export function externalVideoUrl(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&((u.hostname==='www.atptour.com'&&u.pathname.startsWith('/en/video/'))||(u.hostname==='www.wtatennis.com'&&u.pathname.startsWith('/videos/')));}catch{return false;}}
export function validate(a){
  const errors=[];check(schema,a,'edition',errors);if(errors.length)return errors;
  const fail=(path,message)=>errors.push({path,message});
  const sources=new Set(a.sources.map(s=>s.id));if(sources.size!==a.sources.length)fail('sources','Source IDs must be unique.');
  function walk(v,p){if(typeof v==='string'){
    if(/<\/?[a-z!]|```|!\[|\]\(|||\[\d+†|^\s*#{1,6}\s|\*\*[^*]+\*\*/mi.test(v))fail(p,'Use plain text, without HTML, Markdown or citation tokens.');
    if(/^\d{4}-\d{2}-\d{2}(T|$)/.test(v)&&!/(\.id|\.slug)$/.test(p)){if(!Number.isFinite(Date.parse(v))||new Date(v.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)!==v.slice(0,10))fail(p,'Invalid calendar date.');}
    if(p.endsWith('.url')){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)throw Error();}catch{fail(p,'Use an absolute HTTPS URL without credentials.');}}
  }else if(Array.isArray(v))v.forEach((x,i)=>walk(x,p+'['+i+']'));else if(v&&typeof v==='object'){if(v.sourceIds)for(const id of v.sourceIds)if(!sources.has(id))fail(p+'.sourceIds','Unknown source '+id+'.');Object.entries(v).forEach(([k,x])=>walk(x,p+'.'+k));}}
  walk(a,'edition');
  const ts=k=>Date.parse(a[k]);
  for(const [i,s]of a.sources.entries())if(Date.parse(s.accessedAt)>ts('factsCheckedAt'))fail('sources['+i+'].accessedAt','Source retrieval cannot follow the stated fact-check time.');
  for(const [i,s]of a.sources.entries())if(s.publishedAt&&Date.parse(s.publishedAt)>Date.parse(s.accessedAt))fail('sources['+i+'].publishedAt','Source publication cannot follow actual retrieval.');
  if(new Date(a.issueDate+'T12:00:00Z').getUTCDay()!==5)fail('issueDate','The intended issue date must be a Friday.');
  if(a.id!=='cu-weekly-'+a.issueDate)fail('id','ID must match the intended issue date.');
  if(!a.slug.startsWith(a.issueDate+'-'))fail('slug','Slug must begin with issueDate.');
  if(!(ts('coverageStart')<ts('coverageEnd')&&ts('coverageEnd')<=ts('plannedCutoff')&&ts('coverageEnd')<=ts('factsCheckedAt')))fail('coverageEnd','Require start < end ≤ planned cutoff and facts checked time.');
  if(ts('coverageEnd')-ts('coverageStart')>7*86400000+3600000)fail('coverageStart','Coverage must fit the rolling seven-day window (including DST).');
  if(a.status==='published'&&(!a.publishedAt||!a.editionNumber))fail('publishedAt','Publication requires an assigned edition number and real publication timestamp.');
  if(a.publishedAt&&ts('publishedAt')<ts('coverageEnd'))fail('publishedAt','Publication cannot precede coverage end.');
  if(a.updatedAt&&(!a.publishedAt||ts('updatedAt')<=ts('publishedAt')))fail('updatedAt','A revision must be later than original publication.');
  if(a.publishedAt&&ts('factsCheckedAt')>ts(a.updatedAt?'updatedAt':'publishedAt'))fail('factsCheckedAt','Fact checking cannot follow the published revision.');
  for(const [i,c] of a.corrections.entries())if(!a.updatedAt||Date.parse(c.at)<ts('publishedAt')||Date.parse(c.at)>ts('updatedAt'))fail('corrections['+i+'].at','Corrections must lie between publication and the current revision.');
  let last=-1,reveals=0,timelines=0;const ids=new Set();
  a.sections.forEach((s,i)=>{const p='sections['+i+']',n=sectionOrder.indexOf(s.id);if(n<=last)fail(p+'.id','Sections must be unique and in contract order.');last=n;ids.add(s.id);
    if(!s.paragraphs.length&&!s.tables.length&&!s.timeline.length&&!s.reveal&&!s.videos.length)fail(p,'Explain missing evidence instead of leaving an empty module.');
    s.paragraphs.forEach((v,j)=>{if(v.kind==='fact'&&!v.sourceIds.length)fail(p+'.paragraphs['+j+'].sourceIds','Facts require a supporting source.');});
    if(s.timeline.length){timelines++;if(s.timeline.length<3)fail(p+'.timeline','Use three to five events.');s.timeline.forEach((v,j)=>{if(!v.sourceIds.length)fail(p+'.timeline['+j+']','A timeline event needs evidence.');});}
    if(s.reveal){reveals++;const opts=s.reveal.options.map(x=>x.id);if(new Set(opts).size!==opts.length||!opts.includes(s.reveal.answerOptionId))fail(p+'.reveal','Answer must identify one unique option.');if(!s.reveal.sourceIds.length)fail(p+'.reveal.sourceIds','An explanation needs evidence.');}
    const tableIds=new Set();s.tables.forEach((t,j)=>{const q=p+'.tables['+j+']',keys=t.columns.map(c=>c.key);if(tableIds.has(t.id))fail(q+'.id','Duplicate table ID.');tableIds.add(t.id);if(new Set(keys).size!==keys.length)fail(q+'.columns','Column keys must be unique.');if(!/\b(selected|all)\b/i.test(t.caption))fail(q+'.caption','Say selected or all and explain the scope.');
      const required={results:['tournament','tour','round','date','winner','opponent','score','status'],rankings:['rank','player','points'],'player-updates':['player','status','reported-issue','announcement-date','return-status'],schedule:['tournament','tour','location','dates','status']}[t.variant]||[];for(const k of required)if(!keys.includes(k))fail(q+'.columns','Missing required column '+k+'.');
      if(t.variant==='rankings'&&t.asOf&&t.asOf>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(a.coverageEnd)))fail(q+'.asOf','Ranking release date cannot follow the edition cutoff.');
      if(t.variant==='rankings'&&((t.asOf&&!t.caption.includes(t.asOf)&&!t.caption.includes(new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(t.asOf+'T00:00:00Z'))))||!/singles/i.test(t.scope)||/\b(live|race|doubles)\b/i.test(t.scope)))fail(q,'Rankings need official singles scope and publication date in caption when available.');
      t.rows.forEach((r,k)=>{if(JSON.stringify(Object.keys(r.cells).sort())!==JSON.stringify([...keys].sort()))fail(q+'.rows['+k+'].cells','Cells must match column keys exactly.');if(!r.sourceIds.length)fail(q+'.rows['+k+'].sourceIds','Each factual row requires evidence.');if(t.variant==='results'){if(!['completed','retired','walkover','defaulted'].includes(r.cells.status))fail(q+'.rows['+k+'].cells.status','Use completed, retired, walkover or defaulted.');if(r.cells.status==='walkover'&&!['','—','N/A','not played'].includes(r.cells.score))fail(q+'.rows['+k+'].cells.score','A walkover has no played score.');}});
    });
    s.videos.forEach((v,j)=>{const q=p+'.videos['+j+']';if(!v.sourceIds.length)fail(q+'.sourceIds','Video provenance requires evidence.');if(v.provider==='youtube'&&!youtubeId(v.url))fail(q+'.url','Use https://www.youtube.com/watch?v= followed by the video ID only.');if(v.provider==='external'&&!externalVideoUrl(v.url))fail(q+'.url','External video links must use the approved ATP /en/video/ or WTA /videos/ HTTPS paths, without query parameters.');if(v.embedAllowed&&(v.provider!=='youtube'||v.rightsStatus==='link-only'))fail(q+'.embedAllowed','Only evidenced YouTube rights can allow embedding.');});
  });
  for(const tour of tours){const t=tableFor(a,tour.id);if(!t)fail('sections.rankings.tables','Add '+tour.id+'-top10 with a missing-data explanation if needed.');else{if(t.variant!=='rankings')fail('tables.'+t.id,'Use rankings variant.');if(JSON.stringify(t.columns.map(c=>c.key))!==JSON.stringify(rankingColumns.map(c=>c.key)))fail('tables.'+t.id+'.columns','Use rank, player, points, rank-change, points-change in order.');if((t.rows.length!==10||!t.asOf)&&!t.note)fail('tables.'+t.id+'.note','Explain missing or partial ranking data.');if(t.rows.length>10)fail('tables.'+t.id+'.rows','Top 10 tables contain at most ten rows.');}}
  for(const id of requiredSections)if(!ids.has(id))fail('sections','Missing required section '+id+'.');
  if(reveals>1)fail('sections','At most one retrospective reveal.');if(timelines>1)fail('sections','At most one timeline.');errors.push(...resultsErrors(a));return errors;
}
export function assertValid(a){const errors=validate(a);if(errors.length)throw new Error(errors.map(e=>e.path+': '+e.message).join('\n'));return a;}
// Private saving permits incomplete values, but preserves the exact contract shape,
// types, component limits and unknown-field rejection. Export still uses validate().
export function validateWorkingDraft(a){
  const relax=s=>Array.isArray(s)?s.map(relax):s&&typeof s==='object'?Object.fromEntries(Object.entries(s).filter(([k])=>!['pattern','minLength','minItems','minimum'].includes(k)).map(([k,v])=>[k,relax(v)])):s;
  const errors=[];check(relax(schema),a,'edition',errors);return errors;
}
export const eligible=(a,now=Date.now())=>a.status==='published'&&a.editionNumber!==null&&a.publishedAt!==null&&Date.parse(a.publishedAt)<=now;
