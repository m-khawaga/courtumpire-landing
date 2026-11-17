import { activities, byId } from './catalogue.mjs';
export const SESSION_KEY = 'courtumpire.practice.v1';
export const activityCounts = [3, 4, 5, 6, 7, 8];
export const defaults = Object.freeze({ players: 2, duration: 60, goal: 'A mix', level: 'Beginner', focus: '', facilities: ['court'], equipment: ['rackets', 'balls'], activityCount: activityCounts[0] });
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

function minimumMinutes(pool, count) {
  if (pool.length < count) return Infinity;
  return pool.map(a => a.minimum).sort((a,b) => a-b).slice(0,count).reduce((sum,minutes) => sum+minutes,0);
}

function minimumPlanMinutes(pool, count) {
  const intro = pool.filter(a => a.intro).sort((a,b) => a.minimum-b.minimum)[0];
  if (!intro) return Infinity;
  return intro.minimum + minimumMinutes(pool.filter(a => a !== intro), count-1) + count-1;
}

export function generate(settings) {
  if (!validSettings(settings)) throw new Error('Choose 1–4 players and a whole duration from 15 to 180 minutes.');
  const { activityCount = defaults.activityCount, ...preferences } = settings;
  if (!activityCounts.includes(activityCount)) throw new Error('Choose 3 to 8 activities.');
  const pool = compatible(settings);
  const minimum = minimumPlanMinutes(pool, activityCount);
  if (settings.duration < minimum) {
    if (Number.isFinite(minimum)) {
      throw new Error(`${activityCount} activities need at least ${minimum} minutes including transitions. Try ${minimum} minutes.`);
    }
    const fallback = [...activityCounts].reverse().find(count => count < activityCount && minimumPlanMinutes(pool,count) <= 180);
    const suggestion = fallback === undefined ? 'Try another player count or level.' :
      `Try ${fallback} activities at ${Math.max(settings.duration,minimumPlanMinutes(pool,fallback))} minutes.`;
    throw new Error(`There aren't enough compatible activities for a ${activityCount}-activity plan with these settings. ${suggestion}`);
  }
  const score = a => (a.focus.includes(settings.focus) ? 8 : 0) +
    (settings.goal === 'Fun games' && a.type === 'Competitive game' ? 5 : 0) +
    (settings.goal === 'Technique practice' && a.type === 'Cooperative drill' ? 5 : 0) +
    (settings.goal === 'Match preparation' && (a.focus.includes('Serve and return') || a.type === 'Match format') ? 5 : 0);
  // Stable, settings-based variation lets new catalogue entries participate without changing saved IDs.
  const signature=JSON.stringify(preferences),rank=id=>{let h=2166136261;for(const ch of signature+id){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const ranked = [...pool].sort((a,b) => score(b)-score(a) || rank(a.id)-rank(b.id) || a.id.localeCompare(b.id));
  const blocks = [];
  let remaining = settings.duration - (activityCount-1);
  for (let position=0; position<activityCount; position++) {
    const left = activityCount-position-1;
    // Keep the ranking preferences whenever the cheapest possible completion still fits.
    const fits = a => a.minimum + minimumMinutes(ranked.filter(b => b !== a),left) <= remaining;
    const chosen = ranked.find(a => fits(a) && (position===0 ? a.intro : left>0 || a.type!=='Cooperative drill')) ||
      ranked.find(fits);
    blocks.push({ id:chosen.id, minutes:chosen.minimum });
    remaining -= chosen.minimum;
    ranked.splice(ranked.indexOf(chosen),1);
  }
  // Keep the introduction short and share the remaining time across every other block.
  const introTarget = Math.min(byId.get(blocks[0].id).suggested,Math.floor(settings.duration/(activityCount+1)));
  const introExtra = Math.max(0,Math.min(remaining,introTarget-blocks[0].minutes));
  blocks[0].minutes += introExtra;
  remaining -= introExtra;
  for (let i=0; i<remaining; i++) blocks[1 + i%(activityCount-1)].minutes++;
  return { version:1, settings:structuredClone({ ...settings, activityCount }), blocks, edited:false };
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
    const settings = structuredClone(s.settings);
    if (!activityCounts.includes(settings.activityCount)) settings.activityCount = defaults.activityCount;
    return { version:1, settings, blocks:s.blocks.map(b => ({ id:b.id, minutes:b.minutes })), edited:s.edited };
  } catch { return null; }
}
export function load(storage) {
  try { const raw = storage.getItem(SESSION_KEY); return { session:restore(raw), invalid:raw !== null && !restore(raw), unavailable:false }; }
  catch { return { session:null, invalid:false, unavailable:true }; }
}
export function save(storage, session) { try { storage.setItem(SESSION_KEY,JSON.stringify(session)); return true; } catch { return false; } }
export function summary(session) {
  return `CourtUmpire practice · ${session.settings.players} players · ${activityLabel(session.blocks.length)} · ${total(session)} / ${session.settings.duration} minutes\n` +
    session.blocks.map((b,i) => `${i+1}. ${byId.get(b.id).title} — ${b.minutes} min${i < session.blocks.length-1 ? '\n   Transition / retrieve / change roles — 1 min' : ''}`).join('\n');
}
export const activityLabel = count => `${count} activit${count===1?'y':'ies'}`;
