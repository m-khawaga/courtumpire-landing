import { brandedDocument } from '../tools/print.mjs';
import { byId } from './catalogue.mjs';
import { total } from './core.mjs';
import { court, instructions, escape } from './render.mjs';
export function printReport(session) {
  if (!session?.blocks.length) return '';
  const s=session.settings;
  return brandedDocument('Practice Plan',`${s.players} player${s.players>1?'s':''} · ${total(session)} planned / ${s.duration} target minutes · ${s.level} · Focus: ${s.focus||'Varied practice'} · Goal: ${s.goal}`,`<div class="report-activities">${session.blocks.map((b,i)=>{
    const a=byId.get(b.id);
    return `<section class="report-activity"><div class="report-title"><h2>${i+1}. ${escape(a.title)}</h2><strong>${b.minutes} min</strong></div><div class="report-overview">${court(a)}<div><p><strong>Purpose:</strong> ${escape(a.objective)}</p><p><strong>Setup:</strong> ${escape(a.setup)}</p><p class="report-requirements">${a.facilities.includes('wall')?'Permitted practice wall · ':''}${a.focus.map(escape).join(' · ')}</p></div></div>${instructions(a,false)}${i<session.blocks.length-1?'<p class="report-transition">Next: 1 minute to retrieve, pause and change roles (included in total).</p>':'<p class="report-transition">End of practice. The listed scoring systems are optional practice rules.</p>'}</section>`;
  }).join('')}</div>`);
}
