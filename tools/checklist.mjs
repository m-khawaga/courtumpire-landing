export const CHECKLIST_KEY='courtumpire.checklist.v1',CHECKLISTS_KEY='courtumpire.checklists.v2';
export const startingItems=[
 'Confirm court booking, access and available session time.',
 'Confirm attendance, player count and any late arrivals.',
 'Check rackets, balls, permitted court equipment and loose-ball storage.',
 'Agree singles/doubles, round length and the scoring format.',
 'Prepare court assignments, partner/opponent rotations and rests.',
 'Share arrival time, court location, format and what to bring with participants.',
 'Prepare a readable schedule and explain changeovers before play.',
 'Collect equipment and agree the next session focus before leaving.'
];
export const newChecklist=()=>({version:1,items:startingItems.map((text,i)=>({id:`default-${i}`,text,done:false}))});
export function restoreChecklist(raw){try{const s=JSON.parse(raw);if(s?.version!==1||!validItems(s.items))return null;return {version:1,items:s.items.map(({id,text,done})=>({id,text,done}))};}catch{return null;}}
export const checklistTemplates={
 session:{label:'Session checklist',description:'Prepare and deliver a practice: goals, equipment, warm-up, activities and a useful finish.',defaults:[['default-2',startingItems[2]],['session-goal','Choose one practice goal and activities suitable for the group.'],['session-space','Check the playing space and adapt activities to the available court.'],['session-warmup','Plan a gradual warm-up, water breaks and time to recover.'],['session-explain','Explain each activity, its rotation and a simpler or harder variation.'],['default-7',startingItems[7]]]},
 organizer:{label:'Organizer checklist',description:'Coordinate an event: attendance, courts, communication, schedules and reporting results.',defaults:[['organizer-booking',startingItems[0]],['organizer-attendance',startingItems[1]],['organizer-format','Publish the agreed playing format, schedule and any event-specific rules.'],['organizer-courts',startingItems[4]],['organizer-message',startingItems[5]],['organizer-changeovers',startingItems[6]],['organizer-results','Agree where players report results and who records them.'],['organizer-close','Confirm the finish time, return access equipment and leave courts ready for others.']]}
};
function validItems(items){return Array.isArray(items)&&items.length<=50&&items.every(i=>typeof i.id==='string'&&i.id.length<=100&&typeof i.text==='string'&&i.text.trim()&&Array.from(i.text).length<=180&&typeof i.done==='boolean')&&new Set(items.map(i=>i.id)).size===items.length;}
export function newTemplate(type){if(!checklistTemplates[type])throw new Error('Choose a checklist template.');return {items:checklistTemplates[type].defaults.map(([id,text],order)=>({id,text,done:false,removed:false,order}))};}
export function loadChecklists(raw,legacyRaw){try{const r=JSON.parse(raw);if(r?.version===2&&['session','organizer'].every(t=>validItems(r.templates?.[t]?.items)&&r.templates[t].items.every(i=>typeof i.removed==='boolean'&&Number.isSafeInteger(i.order)&&i.order>=0)))return {version:2,templates:Object.fromEntries(['session','organizer'].map(t=>[t,{items:r.templates[t].items.map(i=>({id:i.id,text:i.text,done:i.done,removed:i.removed,order:i.order}))}]))};}catch{/* Fall back to the untouched legacy record. */}const legacy=restoreChecklist(legacyRaw);return {version:2,templates:{session:legacy?{items:legacy.items.map((i,order)=>({...i,order,removed:false}))}:newTemplate('session'),organizer:newTemplate('organizer')}};}
export const orderedItems=state=>[...state.items].sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
export const activeItems=state=>orderedItems(state).filter(i=>!i.removed);
export function setRemoved(state,id,removed){const item=state.items.find(i=>i.id===id);if(!item)throw new Error('Reminder is unavailable.');item.removed=removed;}
export function deleteRemoved(state,id){const item=state.items.find(i=>i.id===id);if(!item?.removed)throw new Error('Only removed reminders can be permanently deleted.');state.items=state.items.filter(i=>i.id!==id);}
export function addReminder(state,text,id){text=text.trim();if(!text||Array.from(text).length>180||state.items.length>=50)throw new Error('Use a reminder of 1–180 characters, with up to 50 active and removed items per template.');if(state.items.some(i=>i.id===id))throw new Error('Reminder identity already exists.');state.items.push({id,text,done:false,removed:false,order:Math.max(-1,...state.items.map(i=>i.order))+1});}
export function restoreDefaults(state,type){for(const [id,text]of checklistTemplates[type].defaults){const item=state.items.find(i=>i.id===id)||state.items.find(i=>i.text===text);if(item)item.removed=false;else{if(state.items.length>=50)throw new Error('This template has 50 reminders including removed items. Existing work was preserved; there is no room for another default item.');state.items.push({id,text,done:false,removed:false,order:Math.max(-1,...state.items.map(i=>i.order))+1});}}}
