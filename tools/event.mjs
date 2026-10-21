import {escape as e} from '../practice/html.mjs';
import {clubLogoFields,bindClubLogo} from './club-logo.mjs';
export const EVENT_KEY='courtumpire.event.v1';
export const emptyEvent=()=>({name:'',venue:'',date:'',organizer:'',contact:''});
export function cleanEvent(value={}){const out=emptyEvent();for(const key of Object.keys(out)){if(typeof value[key]!=='string'&&value[key]!==undefined)throw new Error('Event details must be plain text.');out[key]=String(value[key]||'').trim();if(out[key].length>(key==='name'?160:180))throw new Error('Keep event details within the indicated length.');}if(out.date&&!/^\d{4}-\d{2}-\d{2}$/.test(out.date))throw new Error('Choose a valid event date.');if(out.date&&(!Number.isFinite(new Date(out.date+'T12:00:00Z').getTime())||new Date(out.date+'T12:00:00Z').toISOString().slice(0,10)!==out.date))throw new Error('Choose a real calendar date.');return out;}
export function loadEvent(storage){try{const saved=JSON.parse(storage.getItem(EVENT_KEY));return saved?.version===1?cleanEvent(saved.event):emptyEvent();}catch{return emptyEvent();}}
export function eventFields(){return `<fieldset class="event-fields"><legend>Shared event details</legend><p>Reused across club documents in this browser. No account or cloud storage.</p><div class="form-pair">${[['name','Tournament / event name'],['venue','Club / venue'],['date','Event date'],['organizer','Organizer'],['contact','Contact (optional)']].map(([key,label])=>`<label>${label}<input name="event-${key}" data-event-field="${key}" type="${key==='date'?'date':'text'}" maxlength="${key==='name'?160:180}"></label>`).join('')}</div><p data-event-status class="muted"></p></fieldset>${clubLogoFields()}`;}
export function bindEvent(root=document,onChange=()=>{}){
 let state;try{state=loadEvent(localStorage);}catch{state=emptyEvent();}
 const fields=[...root.querySelectorAll('[data-event-field]')];for(const field of fields)field.value=state[field.dataset.eventField];
 function read(){return cleanEvent(Object.fromEntries(fields.map(f=>[f.dataset.eventField,f.value])));}
 for(const field of fields)field.addEventListener('input',()=>{try{state=read();try{localStorage.setItem(EVENT_KEY,JSON.stringify({version:1,event:state}));root.querySelector('[data-event-status]').textContent='Event details saved in this browser.';}catch{root.querySelector('[data-event-status]').textContent='Storage unavailable. Details work for this visit; print before leaving.';}onChange(state);}catch(err){root.querySelector('[data-event-status]').textContent=err.message;}});
 bindClubLogo(root,()=>onChange(state));return {read};
}
export function eventSummary(event){return [event.name,event.venue,event.date].filter(Boolean).map(e).join(' · ');}
