import { activities, byId } from './catalogue.mjs';
export const SESSION_KEY = 'courtumpire.practice.v1';
export const defaults = Object.freeze({ players: 2, duration: 60, goal: 'A mix', level: 'Beginner', focus: '', facilities: ['court'], equipment: ['rackets', 'balls'] });
export const goals = ['Fun games', 'Technique practice', 'Match preparation', 'A mix'];
export const levels = ['Beginner', 'Intermediate', 'Advanced', 'Mixed'];
export const focuses = ['Consistency', 'Crosscourt', 'Down the line', 'Volleys', 'Serve and return', 'Movement', 'Doubles teamwork'];
export function validSettings(s) {
  return !!s && [1,2,3,4].includes(s.players) && Number.isInteger(s.duration) && s.duration >= 15 && s.duration <= 180 &&
    goals.includes(s.goal) && levels.includes(s.level) && ['', ...focuses].includes(s.focus) &&
    Array.isArray(s.facilities) && s.facilities.includes('court') && s.facilities.every(f => ['court','wall'].includes(f)) &&
    Array.isArray(s.equipment) && ['rackets','balls'].every(e => s.equipment.includes(e)) && s.equipment.every(e => ['rackets','balls'].includes(e));
}
export function conflicts(a, s) {
  const issues = [];
  if (!a.players.includes(s.players)) issues.push(`Needs ${a.players.join(' or ')} player${a.players[0] === 1 ? '' : 's'}; your session has ${s.players}.`);
  for (const f of a.facilities) if (!s.facilities.includes(f)) issues.push(`Needs a ${f}; this is not available in your session.`);
  for (const e of a.equipment) if (!s.equipment.includes(e)) issues.push(`Needs ${e}.`);
  return issues;
}
export function compatible(s) {
  return activities.filter(a => !conflicts(a,s).length && (s.level !== 'Beginner' || a.level === 'Beginner'));
}
export function total(session) { return session.blocks.reduce((n,b) => n + b.minutes, 0) + Math.max(0, session.blocks.length-1); }
export function generate(settings) {
  if (!validSettings(settings)) throw new Error('Choose 1–4 players and a whole duration from 15 to 180 minutes.');
  const pool = compatible(settings);
  const score = a => (a.focus.includes(settings.focus) ? 8 : 0) +
    (settings.goal === 'Fun games' && a.type === 'Competitive game' ? 5 : 0) +
    (settings.goal === 'Technique practice' && a.type === 'Cooperative drill' ? 5 : 0) +
    (settings.goal === 'Match preparation' && (a.focus.includes('Serve and return') || a.type === 'Match format') ? 5 : 0);
  // Stable, settings-based variation lets new catalogue entries participate without changing saved IDs.
  const signature=JSON.stringify(settings),rank=id=>{let h=2166136261;for(const ch of signature+id){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const ranked = [...pool].sort((a,b) => score(b)-score(a) || rank(a.id)-rank(b.id) || a.id.localeCompare(b.id));
  const intro = ranked.find(a => a.intro);
  const main = ranked.find(a => a !== intro);
  const finish = ranked.find(a => a !== intro && a !== main && a.type !== 'Cooperative drill') || ranked.find(a => a !== intro && a !== main);
  if (!intro || !main || !finish) throw new Error('Not enough compatible activities for this combination. Try another player count or level.');
  const chosen = [intro, main, finish];
  const minimum = chosen.reduce((n,a) => n+a.minimum,0) + 2;
  if (settings.duration < minimum) throw new Error(`These activities need at least ${minimum} minutes including two 1-minute transitions. Try ${Math.max(30,minimum)} minutes.`);
  const blocks = chosen.map(a => ({ id:a.id, minutes:a.minimum }));
  let remaining = settings.duration-minimum;
  // Intro stays shorter; distribute extra time deterministically across the main and finish.
  while (remaining > 0 && blocks[0].minutes < Math.min(intro.suggested, Math.floor(settings.duration/4))) { blocks[0].minutes++; remaining--; }
  let i = 1;
  while (remaining-- > 0) { blocks[i].minutes++; i = i === 1 ? 2 : 1; }
  return { version:1, settings:structuredClone(settings), blocks, edited:false };
}
export function swapOptions(session, index) {
  const used = new Set(session.blocks.map(b => b.id));
  return compatible(session.settings).filter(a => !used.has(a.id) && a.minimum <= session.blocks[index].minutes);
}
export function add(session, id) {
  const a = byId.get(id);
  if (!a) throw new Error('This activity is unavailable.');
  const issues = conflicts(a,session.settings);
  if (issues.length) throw new Error(issues.join(' '));
  if (session.blocks.length >= 24) throw new Error('This session already has 24 activities. Remove one before adding another.');
  return { ...session, blocks:[...session.blocks,{ id, minutes:a.suggested }], edited:true };
}
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (s?.version !== 1 || !validSettings(s.settings) || !Array.isArray(s.blocks) || s.blocks.length > 24 || typeof s.edited !== 'boolean') return null;
    if (!s.blocks.every(b => b && byId.has(b.id) && Number.isInteger(b.minutes) && b.minutes >= byId.get(b.id).minimum && b.minutes <= 180 && !conflicts(byId.get(b.id), s.settings).length)) return null;
    return { version:1, settings:structuredClone(s.settings), blocks:s.blocks.map(b => ({ id:b.id, minutes:b.minutes })), edited:s.edited };
  } catch { return null; }
}
export function load(storage) {
  try { const raw = storage.getItem(SESSION_KEY); return { session:restore(raw), invalid:raw !== null && !restore(raw), unavailable:false }; }
  catch { return { session:null, invalid:false, unavailable:true }; }
}
export function save(storage, session) { try { storage.setItem(SESSION_KEY,JSON.stringify(session)); return true; } catch { return false; } }
export function summary(session) {
  return `CourtUmpire practice · ${session.settings.players} players · ${total(session)} / ${session.settings.duration} minutes\n` +
    session.blocks.map((b,i) => `${i+1}. ${byId.get(b.id).title} — ${b.minutes} min${i < session.blocks.length-1 ? '\n   Transition / retrieve / change roles — 1 min' : ''}`).join('\n');
}
