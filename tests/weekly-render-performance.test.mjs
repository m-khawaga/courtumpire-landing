import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmphasizer,escapeText,friendlyDate} from '../weekly-core/presentation.mjs';

// Behavioral oracle from the previous renderer, including priority and seen rules.
function original(text,names,seen){let out='',i=0;while(i<text.length){const url=text.slice(i).match(/^https?:\/\/\S+/);if(url){out+=escapeText(url[0]);i+=url[0].length;continue;}const name=names.find(n=>!seen.has(n)&&text.startsWith(n,i)&&!/[\p{L}\p{N}]/u.test(text[i-1]||' ')&&!/[\p{L}\p{N}]/u.test(text[i+n.length]||' '));if(name){out+='<strong>'+escapeText(name)+'</strong>';seen.add(name);for(const n of names)if(name.endsWith(' '+n)||n.endsWith(' '+name))seen.add(n);i+=name.length;}else out+=escapeText(text[i++]);}return out;}

test('indexed emphasis preserves escaping, URL exclusion, priority, Unicode boundaries and section state',()=>{
 const names=['Sample Alex Robin','Alex Robin','Robin','Open','<unsafe>','東京選手','Świątek','Rybakina','😀 Player','http','Alex'];
 const fragments=['Alex Robin','Sample Alex Robin','Robin','Robinson','1Robin','Świątek','Świątekowie','東京選手','<unsafe>','&"\'','https://example.invalid/Robin?name=Alex&x=<unsafe>','http://example.invalid/Świątek','😀 Player','Open','Alex','Rybakina'];
 let seed=41;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let section=0;section<40;section++){
  const order=section%2?names:[...names].reverse(),fast=createEmphasizer(order),before=new Set(),after=new Set();
  for(let paragraph=0;paragraph<15;paragraph++){
   const text=Array.from({length:12},()=>fragments[random(fragments.length)]).join([' ','. ',' — ',' / '][random(4)]);
   assert.equal(fast(text,after),original(text,order,before));assert.deepEqual(after,before);
  }
 }
});

test('reused formatters retain exact timezone/DST output and do not cache article dates',()=>{
 for(const time of [false,true])for(const timeZone of ['Europe/Berlin','UTC','America/New_York'])for(const value of ['2026-03-29T00:30:00Z','2026-03-29T01:30:00Z','2026-10-25T00:30:00Z','2026-10-25T01:30:00Z','2026-10-19']){
  const expected=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'}:{}),timeZone}).format(new Date(value));
  assert.equal(friendlyDate(value,{time,timeZone}),expected);
 }
 for(const value of [null,'','invalid'])assert.equal(friendlyDate(value),'Date unavailable');
});
