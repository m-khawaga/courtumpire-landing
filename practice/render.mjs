import { sources } from './catalogue.mjs';
import { playUrl } from './site-config.mjs';
import { escape } from './html.mjs';
export { escape } from './html.mjs';
let diagramId = 0;
export function court(a, thumbnail = false) {
  const d = a.diagram, id = `court-${a.id}-${++diagramId}`;
  return `<figure class="court-figure${thumbnail ? ' thumbnail' : ''}"><svg viewBox="0 0 360 400" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg">
    <title id="${id}-title">${escape(a.title)}: court pattern</title><desc id="${id}-desc">${escape(d.description)}</desc>
    <defs><marker id="${id}-ball" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7Z" fill="#dfff00"/></marker><marker id="${id}-move" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill="#91cfff"/></marker></defs>
    <rect class="court-background" width="360" height="400" rx="16" fill="#0a1c33"/><rect class="court-surface" x="55" y="32" width="250" height="336" fill="#174a4c" stroke="#e5f2ef" stroke-width="2"/>
    <g fill="none" stroke="#e5f2ef" stroke-width="2"><path d="M80 32V368M280 32V368M80 114H280M80 286H280M180 114V286M175 32H185M175 368H185"/></g>
    ${d.targets.map(([x,y,w,h,label]) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dfff00" fill-opacity=".16" stroke="#dfff00" stroke-dasharray="5 4"/><text x="${x+w/2}" y="${y+h/2+7}" class="target-label">${escape(label)}</text></g>`).join('')}
    <path d="M42 200H318" stroke="#e5f2ef" stroke-width="4" stroke-dasharray="3 2"/>
    ${d.wall ? '<rect x="55" y="65" width="250" height="28" fill="#516681"/><text x="180" y="86" class="player-label">Practice wall</text>' : '<text x="325" y="205" class="side-label">Net</text>'}
    ${d.balls.map(([x,y,x2,y2]) => `<path d="M${x} ${y} L${x2} ${y2}" stroke="#dfff00" stroke-width="2.8" marker-end="url(#${id}-ball)"/>`).join('')}
    ${d.moves.map(([x,startY,x2,endY]) => { const y = startY >= 340 ? 383 : startY, y2 = endY >= 340 ? 383 : endY; return `<path d="M${x} ${y} Q${(x+x2)/2} ${Math.min(390,(y+y2)/2+12)} ${x2} ${y2}" fill="none" stroke="#91cfff" stroke-width="2.8" stroke-dasharray="6 4" marker-end="url(#${id}-move)"/>`; }).join('')}
    ${d.players.map(([label,x,position]) => { const y = position >= 340 ? 383 : position <= 60 ? 17 : position; return `<g><circle cx="${x}" cy="${y}" r="14" fill="#f7f9fc" stroke="#07172b" stroke-width="2"/><text x="${x}" y="${y+6}" class="player-label" fill="#07172b">${escape(label)}</text></g>`; }).join('')}
  </svg>${thumbnail ? '' : `<figcaption><span class="diagram-legend">● Letter = player &nbsp; <b>→</b> Ball &nbsp; <em>⇢</em> Movement &nbsp; T = target</span><span>${escape(d.description)}</span><span>Starting positions are schematic; follow the written setup.</span></figcaption>`}</figure>`;
}
export function card(a) {
  return `<article class="activity-card">${court(a,true)}<div class="card-copy"><p class="eyebrow">${a.players.join(' / ')} player${a.players[0] === 1 ? '' : 's'} · ${escape(a.level)} · ${a.suggested} min</p><h3><a href="/tennis-drills/${a.slug}/">${escape(a.title)}</a></h3><p>${escape(a.description)}</p><p class="tags">${a.focus.map(escape).join(' · ')}</p><p class="equipment">${a.facilities.includes('wall') ? 'Practice wall required · ' : ''}${a.equipment.map(item=>item==='rackets'?'Rackets':escape(item)).join(' + ')}${!a.equipment.includes('balls')?' · no ball used':''}</p><div class="card-actions"><a class="text-link" href="/tennis-drills/${a.slug}/">View activity <span aria-hidden="true">→</span></a><button type="button" class="secondary small-button" data-add="${a.id}" hidden>Add to my session</button></div></div></article>`;
}
export function instructions(a, includePurpose = true) {
  return `<div class="written-instructions">${includePurpose?`<h3>Purpose & setup</h3><p>${escape(a.objective)}</p><p>${escape(a.setup)}</p>`:''}<h3>How to play</h3><ol>${a.instructions.map(s => `<li>${escape(s)}</li>`).join('')}</ol><h3>Scoring or success</h3><p>${escape(a.scoring)}</p><h3>Rotation & roles</h3><p>${escape(a.rotation)}</p><div class="variations"><div><h3>Make it easier</h3><p>${escape(a.easier)}</p></div><div><h3>Add a challenge</h3><p>${escape(a.harder)}</p></div></div><h3>Mixed levels</h3><p>${escape(a.mixed)}</p>${a.safety?`<h3>Safety & spacing</h3><p>${escape(a.safety)}</p>`:''}</div>`;
}
export function videoReady(v) {
  // Publish reviewed local media only; no remote embeds or requests in this release.
  return !!v && v.status === 'ready' && /^\/assets\/[\w/.-]+\.(mp4|webm)$/.test(v.source) && !v.source.includes('..') && !!v.title && !!v.language;
}
const localMedia = (src, ext) => typeof src === 'string' && new RegExp(`^/assets/[\\w/.-]+\\.(${ext})$`).test(src) && !src.includes('..');
export function video(a) {
  const v = a.video;
  if (!videoReady(v)) return '<p class="video-note">Follow the illustrated instructions. No video has been published for this activity.</p>';
  return `<section class="activity-video"><h3>${escape(v.title)}</h3><video controls preload="none" playsinline aria-label="${escape(v.title)}" ${localMedia(v.poster,'jpg|jpeg|png|webp') ? `poster="${escape(v.poster)}"` : ''} data-video-source="${escape(v.source)}">${localMedia(v.captions,'vtt') ? `<track kind="captions" src="${escape(v.captions)}" srclang="${escape(v.language)}" label="${escape(v.language)}" default>` : ''}</video><p class="video-note" data-video-status>Video · ${escape(v.language)} · ${escape(v.duration || 'duration not specified')}. Written instructions remain available below.</p>${v.transcript ? `<details><summary>Read video transcript</summary><p>${escape(v.transcript)}</p></details>` : ''}${v.credits ? `<p>${escape(v.credits)}</p>` : ''}</section>`;
}
export function editorial(a) {
  return `<details class="editorial"><summary>Sources & editorial status</summary><p>${escape(a.review)} These are optional practice rules, not official competition rules. References support general tennis guidance; they do not endorse this format.</p><ul>${a.sources.map(key => `<li><a href="${sources[key].url}" rel="noopener noreferrer">${escape(sources[key].title)}</a> — ${escape(sources[key].note)}</li>`).join('')}</ul></details>`;
}
export function appInvite() { return `<aside class="app-invite"><div><p class="eyebrow">Taking it into a match?</p><h3>Keep score. Stay in the match.</h3><p>For a regular tennis match, CourtUmpire handles scoring on Android and a connected Wear OS watch. These practice games use their own written scoring rules.</p></div><a class="button" href="${playUrl}" target="_blank" rel="noopener noreferrer">Get CourtUmpire</a></aside>`; }
