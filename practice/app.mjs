import {track} from '../tools/usage.mjs';
import { activities, byId } from './catalogue.mjs';
import { defaults, SESSION_KEY, generate, conflicts, add, swapOptions, total, load, save, summary } from './core.mjs';
import { card, court, instructions, escape } from './render.mjs';
import { hydrateVideos } from './video.mjs';
import { printReport } from './print-plan.mjs';
import { adMode } from './ads-config.mjs';
// No advertising renderer/provider script is fetched in off mode.
const mountAds = adMode(location) === 'preview' ? (await import('./ads.mjs')).mountAds : () => {};
const $ = selector => document.querySelector(selector);
const storage = { getItem:key => localStorage.getItem(key), setItem:(key,value) => localStorage.setItem(key,value) };
const loaded = load(storage);
let session = loaded.session;
let courtsideIndex = null;
let printDetails = [], previousCourtside = null;
const page = document.body.dataset.page;
function notice(message, actions = []) {
  const node = $('#planner-notice') || $('#library-notice');
  if (!node) return;
  node.replaceChildren();
  const p = document.createElement('p'); p.textContent = message; node.append(p);
  for (const action of actions) {
    const button = document.createElement('button'); button.className = 'secondary'; button.type = 'button'; button.textContent = action.label;
    button.addEventListener('click',action.run); node.append(button);
  }
  node.focus();
}
function persist() {
  const saved = save(storage,session);
  if (!saved) notice('Your plan works for this visit, but browser storage is unavailable. Copy or print it before leaving.');
  return saved;
}
function announce(message) {
  const node = $('#planner-notice') || $('#library-notice'); if (node) node.textContent = message;
}
function exposeAdd() { document.querySelectorAll('[data-add]').forEach(button => { button.hidden = false; }); }
exposeAdd();
document.addEventListener('click',event => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const a = byId.get(button.dataset.add);
  if (!a) return;
  const current = session || { version:1, settings:structuredClone(defaults), blocks:[], edited:false };
  const issues = conflicts(a,current.settings);
  if (issues.length) {
    notice(issues.join(' ')+' Start a new compatible session to add it. This replaces your current saved plan.',[
      { label:'Start new compatible session', run:() => {
        session = add({ version:1, settings:{ ...structuredClone(defaults), players:a.players[0], facilities:[...a.facilities] }, blocks:[], edited:false },a.id);
        added(a,persist());
      } }, { label:'Keep my current session', run:() => announce('Your current session is unchanged.') }
    ]);
    return;
  }
  if (current.blocks.some(b=>b.id===a.id) && !confirm('This activity is already in your session. Add a deliberate repeat?')) return;
  try { session = add(current,a.id); added(a,persist()); } catch (error) { notice(error.message); }
});
function added(a,stored) {
  track('drill_used',{player_count:String(a.players[0]),source_context:page});
  notice(`${a.title} added. Your session now has ${session.blocks.length} activities, ${total(session)} planned / ${session.settings.duration} target minutes.${stored?'':' Browser storage is unavailable. Copy or print your plan before leaving.'}`);
  const n = $('#library-notice');
  if (n) { const link = document.createElement('a'); link.href = '/practice-planner/'; link.className = 'text-link'; link.textContent = 'Open my session →'; n.append(link); }
  if (page === 'planner') renderPlan();
}
if (page === 'library') {
  const form = $('#library-filters');
  const params = new URLSearchParams(location.search);
  for (const key of ['players','focus','type','level','search']) { const control = form.elements.namedItem(key); if (params.has(key)) control.value = params.get(key); }
  function filter() {
    const data = new FormData(form), search = String(data.get('search')).trim().toLocaleLowerCase();
    const filtered = activities.filter(a => (!data.get('players') || a.players.includes(Number(data.get('players')))) &&
      (!data.get('type') || a.type === data.get('type')) && (!data.get('focus') || a.focus.includes(data.get('focus'))) &&
      (!data.get('level') || ['Advanced','Mixed'].includes(data.get('level')) || a.level === data.get('level')) &&
      `${a.title} ${a.description} ${a.focus.join(' ')} ${a.facilities.join(' ')}`.toLocaleLowerCase().includes(search));
    $('#result-count').textContent = `${filtered.length} activit${filtered.length===1?'y':'ies'}${['Advanced','Mixed'].includes(data.get('level')) ? ' · use the listed level adaptations' : ''}`;
    $('#results').innerHTML = filtered.length ? filtered.map(card).join('') : `<div class="empty"><h2>No activities match yet.</h2><p>Try fewer filters or clear them to explore all ${activities.length} activities.</p></div>`;
    exposeAdd(); mountAds();
  }
  form.addEventListener('input',filter); form.addEventListener('submit',event => event.preventDefault());
  $('#reset-filters').hidden = false;
  $('#reset-filters').addEventListener('click',() => { form.reset(); filter(); form.elements.search.focus(); });
  filter();
}
if (page === 'planner') {
  // Warm the two small local print assets before a synchronous browser print event.
  for (const source of ['/assets/report-logo.webp','/assets/website-qr.svg']) { const image = new Image(); image.src=source; }
  const form = $('#planner-form'); form.querySelector('button[type=submit]').disabled = false;
  const desiredPlayers = Number(new URLSearchParams(location.search).get('players'));
  function fill(s) {
    for (const key of ['players','goal','level','focus']) form.elements.namedItem(key).value = String(s[key]);
    form.elements.duration.value = [30,45,60,90].includes(s.duration) ? String(s.duration) : 'custom';
    form.elements.custom.value = s.duration;
    form.elements.wall.checked = s.facilities.includes('wall'); updateCustom();
  }
  function updateCustom() { $('#custom-duration-label').hidden = form.elements.duration.value !== 'custom'; }
  fill(session?.settings || { ...defaults, ...([1,2,3,4].includes(desiredPlayers) ? { players:desiredPlayers } : {}) });
  form.elements.duration.addEventListener('change',updateCustom);
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (session?.blocks.length && !confirm('Generate a new plan? This replaces the current activities and any edits.')) return;
    const data = new FormData(form);
    const settings = { players:Number(data.get('players')), duration:Number(data.get('duration') === 'custom' ? data.get('custom') : data.get('duration')), goal:data.get('goal'), level:data.get('level'), focus:data.get('focus'), facilities:['court',...(data.has('wall')?['wall']:[])], equipment:['rackets','balls'] };
    try { session = generate(settings);track('plan_generated',{tool_id:'practice_planner'}); courtsideIndex = null; renderPlan(); if (persist()) announce('Plan generated. Includes one-minute transitions between activities.'); $('#session-area').scrollIntoView({ behavior:'instant', block:'start' }); }
    catch(error) { notice(error.message);track('tool_error',{tool_id:'practice_planner',error_category:'validation'}); }
  });
  renderPlan();
  if (session && desiredPlayers && desiredPlayers !== session.settings.players) announce(`Your saved ${session.settings.players}-player session is open. Change Players and generate to create a ${desiredPlayers}-player plan.`);
}
function renderBlock(block,index,active=false) {
  const a = byId.get(block.id);
  const swaps = swapOptions(session,index);
  return `<article class="session-block" data-block="${index}"><div class="block-heading"><div><p class="block-number">${index===0?'INTRODUCTION':index===session.blocks.length-1?'FINISH':'MAIN PRACTICE'} · ${String(index+1).padStart(2,'0')}</p><h3>${escape(a.title)}</h3></div><span class="block-time">${block.minutes} min</span></div><div class="block-overview">${court(a)}<div><p>${escape(a.objective)}</p><p><strong>Rotation:</strong> ${escape(a.rotation)}</p>${session.settings.level==='Advanced'?`<p><strong>Advanced:</strong> ${escape(a.harder)}</p>`:session.settings.level==='Mixed'?`<p><strong>Mixed levels:</strong> ${escape(a.mixed)}</p>`:''}</div></div><details ${active?'open':''}><summary>Instructions, scoring & variations</summary>${instructions(a)}</details>${active?'':`<div class="block-controls"><label>Minutes<input type="number" min="${a.minimum}" max="180" step="1" value="${block.minutes}" data-minutes="${index}" aria-label="Minutes for ${escape(a.title)}"></label><button class="secondary" type="button" data-up="${index}" ${index===0?'disabled':''} aria-label="Move ${escape(a.title)} up">↑ Up</button><button class="secondary" type="button" data-down="${index}" ${index===session.blocks.length-1?'disabled':''} aria-label="Move ${escape(a.title)} down">↓ Down</button><button class="secondary" type="button" data-swap="${index}" ${swaps.length?'':'disabled'} title="${swaps.length?'Swap for '+escape(swaps[0].title):'No unused compatible activity fits this duration; add from the library or increase this block’s minutes.'}">Swap activity</button><button class="secondary" type="button" data-remove="${index}" aria-label="Remove ${escape(a.title)}">Remove</button></div>${!swaps.length?'<p class="video-note">No unused compatible swap fits this block. Increase its time or explore the library.</p>':''}`}</article>`;
}
function renderPlan() {
  if (page !== 'planner') return;
  const active = courtsideIndex !== null;
  document.body.classList.toggle('courtside',active);
  $('#session-area').querySelector('.courtside-header')?.remove();
  $('#session-area').querySelector('.courtside-controls')?.remove();
  if (!session?.blocks.length) {
    $('#session-summary').innerHTML = '<h2>A plan that fits your court.</h2><p class="muted">Generate a session or add an activity from the library. No wall is assumed.</p>';
    $('#session-controls').innerHTML = '<a class="secondary" href="/tennis-drills/">Browse games & drills</a>';
    if (session) $('#session-controls').insertAdjacentHTML('beforeend','<button class="secondary" type="button" data-clear>Clear saved session</button>');
    $('#session-blocks').innerHTML = ''; $('#print-summary').textContent = ''; return;
  }
  const planned = total(session), target = session.settings.duration;
  $('#session-summary').innerHTML = `<h2>Your practice, ready to play.</h2><p class="plan-total ${planned!==target?'over-target':''}">${planned} planned / ${target} target minutes</p><p class="muted">${session.settings.players} player${session.settings.players>1?'s':''} · ${escape(session.settings.level)} · ${escape(session.settings.goal)} · ${session.blocks.length} activities${session.edited?' · Edited plan':''}<br>Includes ${Math.max(0,session.blocks.length-1)} one-minute transitions for retrieval, water and role changes. Pause longer if you need to.</p>${planned!==target?'<p class="notice">Your edited plan differs from the target. Adjust block minutes, remove activities or regenerate to match it.</p>':''}`;
  $('#session-controls').innerHTML = '<button class="button" type="button" data-start>Start session</button><button class="secondary" type="button" data-print>Print / Save PDF</button><button class="secondary" type="button" data-copy>Copy session summary</button><a class="secondary" href="/tennis-drills/">Add activities</a><button class="secondary" type="button" data-clear>Clear saved session</button>';
  $('#print-summary').textContent = `${session.settings.players} players · ${session.settings.level} · ${planned} planned / ${target} target minutes · Includes one-minute transitions.`;
  if (active) {
    courtsideIndex = Math.max(0,Math.min(courtsideIndex,session.blocks.length-1));
    $('#session-blocks').innerHTML = renderBlock(session.blocks[courtsideIndex],courtsideIndex,true);
    $('#session-area').insertAdjacentHTML('afterbegin',`<div class="courtside-header"><p class="eyebrow">On court · Activity ${courtsideIndex+1} of ${session.blocks.length}</p><button class="secondary" data-exit type="button">Back to plan</button></div>`);
    $('#session-blocks').insertAdjacentHTML('afterend',`<div class="courtside-controls"><button class="secondary" data-previous type="button" ${courtsideIndex===0?'disabled':''}>← Previous</button><span>${courtsideIndex<session.blocks.length-1?'Next: 1-minute transition':'Last activity'}</span><button class="button" data-next type="button" ${courtsideIndex===session.blocks.length-1?'disabled':''}>Next →</button></div>`);
    window.scrollTo(0,0);
  } else $('#session-blocks').innerHTML = session.blocks.map((b,i)=>renderBlock(b,i)+(i<session.blocks.length-1?'<p class="transition">↳ 1 minute · Retrieve, pause and change roles</p>':'')).join('');
  mountAds();
}
function focusControl(attribute,index) {
  const node = $(`[${attribute}="${index}"]`);
  if (node && !node.disabled) node.focus();
  else ($(`[data-minutes="${index}"]`) || $('[data-start]') || $('#planner-form button[type=submit]'))?.focus();
}
document.addEventListener('change',event => {
  const node = event.target.closest('[data-minutes]'); if (!node || !session) return;
  const index = Number(node.dataset.minutes), minutes = Number(node.value), minimum = byId.get(session.blocks[index].id).minimum;
  if (!Number.isInteger(minutes) || minutes < minimum || minutes > 180) { node.value = session.blocks[index].minutes; notice(`Choose a whole duration from ${minimum} to 180 minutes for this activity.`); return; }
  session.blocks[index].minutes = minutes; session.edited = true; renderPlan(); persist(); focusControl('data-minutes',index);
});
document.addEventListener('click',async event => {
  if (page !== 'planner') return;
  const button = event.target.closest('button'); if (!button) return;
  if (button.hasAttribute('data-clear')) {
    if (!confirm('Clear the saved practice session from this browser?')) return;
    let cleared = false;
    try { localStorage.removeItem(SESSION_KEY); cleared = localStorage.getItem(SESSION_KEY)===null; } catch { /* Report the persistence failure. */ }
    session = null; courtsideIndex = null; renderPlan(); announce(cleared?'Saved session cleared.':'Session cleared for this visit. Browser storage could not be cleared; a previous saved session may return after reloading.'); return;
  }
  if (!session?.blocks.length) return;
  if (button.hasAttribute('data-start')) { courtsideIndex = 0; renderPlan(); $('[data-exit]').focus(); return; }
  if (button.hasAttribute('data-exit')) { courtsideIndex = null; renderPlan(); $('[data-start]').focus(); return; }
  if (button.hasAttribute('data-next')) { courtsideIndex++; renderPlan(); $('[data-next]').focus(); return; }
  if (button.hasAttribute('data-previous')) { courtsideIndex--; renderPlan(); $('[data-previous]').focus(); return; }
  if (button.hasAttribute('data-print')) { window.print(); return; }
  if (button.hasAttribute('data-copy')) {
    try { await navigator.clipboard.writeText(summary(session)); announce('Session summary copied.'); }
    catch {
      const node = $('#planner-notice'); node.classList.add('copy-fallback'); node.innerHTML = '<p>Clipboard access is unavailable. Select and copy this summary:</p><textarea readonly aria-label="Session summary to copy"></textarea><p>Use Ctrl+C on Windows or Copy from your device’s selection menu.</p>';
      const textarea = node.querySelector('textarea'); textarea.value = summary(session); textarea.focus(); textarea.select();
    } return;
  }
  let index, focusAttribute;
  if (button.hasAttribute('data-remove')) { index=Number(button.dataset.remove); session.blocks.splice(index,1); focusAttribute='data-remove'; }
  else if (button.hasAttribute('data-up')) { index=Number(button.dataset.up); if (index===0) return; [session.blocks[index-1],session.blocks[index]]=[session.blocks[index],session.blocks[index-1]]; index--; focusAttribute='data-up'; }
  else if (button.hasAttribute('data-down')) { index=Number(button.dataset.down); if (index>=session.blocks.length-1) return; [session.blocks[index+1],session.blocks[index]]=[session.blocks[index],session.blocks[index+1]]; index++; focusAttribute='data-down'; }
  else if (button.hasAttribute('data-swap')) { index=Number(button.dataset.swap); const options = swapOptions(session,index); if (!options.length) return; session.blocks[index].id = options[0].id; announce(`Swapped to ${options[0].title}. Duration preserved.`); focusAttribute='data-swap'; }
  else return;
  session.edited = true; renderPlan(); persist(); focusControl(focusAttribute,Math.min(index,session.blocks.length-1));
});
window.addEventListener('beforeprint',() => {
  if(page!=='planner')return;
  if(session?.blocks.length)track('print_requested',{document_type:'practice_plan'});
  previousCourtside = courtsideIndex;
  if (courtsideIndex !== null) { courtsideIndex = null; renderPlan(); }
  printDetails = [...document.querySelectorAll('#session-blocks details')].map(node => [node,node.open]);
  printDetails.forEach(([node])=> { node.open = true; });
  document.getElementById('print-report')?.remove();
  if (page==='planner' && session?.blocks.length) document.body.insertAdjacentHTML('beforeend',printReport(session));
});
window.addEventListener('afterprint',() => {
  document.getElementById('print-report')?.remove();
  printDetails.forEach(([node,wasOpen])=> { node.open = wasOpen; });
  if (previousCourtside !== null) { courtsideIndex = previousCourtside; renderPlan(); }
});
window.addEventListener('storage',event => {
  if (event.key !== SESSION_KEY) return;
  session = load(storage).session; courtsideIndex = null; renderPlan(); announce('Session updated from another tab. Reload before generating if you want its saved settings in the form.');
});
// Reviewed local videos only; native controls, no autoplay, no remote embeds.
hydrateVideos();
if (loaded.invalid) announce('The saved session was invalid or from an unsupported version. Start a new plan; the website remains usable.');
if (loaded.unavailable) announce('Browser storage is unavailable. You can use the planner for this visit; copy or print before leaving.');
mountAds();
