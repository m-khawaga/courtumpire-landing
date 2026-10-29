export const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Cache formatters, never article data. Fixed publication timezone has two formats.
const dateOptions=(time,timeZone)=>({day:'numeric',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'}:{}),timeZone});
const berlinFormatters=new Map();
export function friendlyDate(value,{time=false,timeZone='Europe/Berlin'}={}){if(!value)return 'Date unavailable';const d=new Date(value);if(!Number.isFinite(d.getTime()))return 'Date unavailable';let formatter;if(timeZone==='Europe/Berlin'){const key=!!time;formatter=berlinFormatters.get(key);if(!formatter){formatter=new Intl.DateTimeFormat('en-GB',dateOptions(time,timeZone));berlinFormatters.set(key,formatter);}}else formatter=new Intl.DateTimeFormat('en-GB',dateOptions(time,timeZone));return formatter.format(d);}
// Only explicit category text supplied in the tour cell is used. Event names are never classified.
export function category(row){const text=row.cells.tour||'';const rules=[[/grand slam/i,'Grand Slam',0],[/\b(?:ATP|WTA) Finals\b/i,'Tour Finals',1],[/(?:Masters\s*1000|WTA\s*1000)/i,'1000',2],[/\b(?:ATP|WTA)\s*500\b/i,'500',3],[/\b(?:ATP|WTA)\s*250\b/i,'250',4],[/\b(?:team|Davis Cup|Billie Jean King Cup)\b/i,'Team event',5]];for(const [pattern,label,order]of rules)if(pattern.test(text))return {label,order};return {label:'Category not specified',order:6};}
function dateKey(row){const text=row.cells.date||row.cells.dates||'';const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/);if(iso)return Date.parse(iso[0]);const m=text.match(/\b(\d{1,2})(?:[–-]\d{1,2})?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:[–-]\d{1,2}\s+[A-Za-z]+)?\s+(\d{4})\b/i);return m?Date.parse(`${m[1]} ${m[2]} ${m[3]}`):Infinity;}
export function orderedRows(table){return ['results','schedule'].includes(table.variant)?table.rows.map((row,index)=>({row,index})).sort((a,b)=>category(a.row).order-category(b.row).order||(dateKey(a.row)-dateKey(b.row))||a.index-b.index).map(x=>x.row):table.rows;}
export function entityNames(article){const names=new Set();for(const s of article.sections)for(const t of s.tables)for(const r of t.rows)for(const key of ['player','winner','opponent','tournament']){const value=r.cells[key];if(value&&value!=='N/A')for(const name of value.split(/\s+(?:\/|&|and)\s+/))if(name.length>3)names.add(name);if(value&&key==='tournament'){const short=value.split(',')[0].replace(/\s+(Open|Masters)$/,'');if(short.length>=4&&short!==value)names.add(short);const city=value.split(',')[1]?.trim();if(city&&city.length>=4)names.add(city);}}const full=[...names];for(const name of full){if(name.includes(' ')&&!/Open|Masters|Championship|Final|Cup/i.test(name)){const last=name.split(' ').at(-1);if(last.length>=4&&full.filter(n=>n.endsWith(' '+last)).length===1){names.add(last);if(name.split(' ').length>=3)names.add(name.split(' ').slice(-2).join(' '));}}}return [...names].sort((a,b)=>b.length-a.length);}
// Token scanning operates on paragraph text only; input is always escaped and URLs skipped.
export function createEmphasizer(names){
 // Request-local prefix index; preserve the caller's name order and seen rules.
 const root=new Map();names.forEach((name,priority)=>{if(!name)return;let node=root;for(let i=0;i<name.length;i++){if(!node.has(name[i]))node.set(name[i],new Map());node=node.get(name[i]);}if(!node.has(null))node.set(null,{name,priority});});
 const word=c=>/[\p{L}\p{N}]/u.test(c||' ');
 return (text,seen=new Set())=>{let out='',i=0,start=0;
  while(i<text.length){
   if(text[i]==='h'){const url=text.slice(i).match(/^https?:\/\/\S+/);if(url){i+=url[0].length;continue;}}
   let match;
   if(!word(text[i-1])){let node=root;for(let j=i;j<text.length;j++){node=node.get(text[j]);if(!node)break;const candidate=node.get(null);if(candidate&&!seen.has(candidate.name)&&!word(text[j+1])&&(!match||candidate.priority<match.priority))match=candidate;}}
   if(match){const name=match.name;out+=escapeText(text.slice(start,i))+'<strong>'+escapeText(name)+'</strong>';seen.add(name);for(const n of names)if(name.endsWith(' '+n)||n.endsWith(' '+name))seen.add(n);i+=name.length;start=i;}else i++;
  }
  return out+escapeText(text.slice(start));
 };
}
export function emphasize(text,names,seen=new Set()){return createEmphasizer(names)(text,seen);}

