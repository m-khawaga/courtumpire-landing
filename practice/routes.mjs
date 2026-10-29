import {weeklyRoutes} from '../weekly/routes.mjs';
import { activities } from './catalogue.mjs';
import { playerPages } from './player-pages.mjs';
export const productionOrigin = 'https://courtumpire.com';
// Public identity, parentage and canonical policy in one source. No draft tool routes.
export const routeDefinitions = [
  ...weeklyRoutes,
  { id:'home', path:'/', title:'CourtUmpire — Tennis practice and scoring for Android', label:'Home', section:'home' },
  { path:'/contact.html', label:'Contact', section:'legal', parent:'/' },
  { path:'/privacy.html', label:'Privacy Policy', section:'legal', parent:'/' },
  { path:'/impressum.html', label:'Legal Notice', section:'legal', parent:'/' },
  { id:'practice', path:'/practice/', title:'Tennis practice for your next hit', label:'Practice', section:'practice', parent:'/' },
  { id:'planner', path:'/practice-planner/', title:'Tennis Practice Planner for 1–4 Players', label:'Build a practice', section:'practice', parent:'/practice/' },
  { id:'players', path:'/practice/players/', title:'Tennis Practice for 1–4 Players', label:'Practice for 1–4 players', section:'practice', parent:'/practice/' },
  { id:'drills', path:'/tennis-drills/', title:'Tennis games and drills for 1–4 players', label:'Find a drill', section:'practice', parent:'/practice/' },
  ...playerPages.map(p=>({ path:`/tennis-drills/${p.slug}/`, title:`Tennis Drills for ${p.count} Player${p.count>1?'s':''}`, label:p.title, section:'practice', parent:'/practice/players/' })),
  ...activities.map(a=>({ path:`/tennis-drills/${a.slug}/`, title:`${a.title}: Tennis Practice for ${a.players.join(' or ')} Player${a.players[0]>1?'s':''}`, label:a.title, section:'practice', parent:`/tennis-drills/${a.players[0]}-player${a.players[0]>1?'s':''}/` })),
  { id:'play', path:'/play-score/', title:'Tennis Scoring Tools: Score, Learn and Share', label:'Play & Score', section:'play', parent:'/' },
  { id:'scoreboard', path:'/play-score/scoreboard/', title:'Tennis Scoreboard and Guided Scoring Demo', label:'Score a match', section:'play', parent:'/play-score/' },
  { id:'helper', path:'/play-score/tiebreak-calculator/', title:'Tennis Tiebreak Calculator: Who Serves Next?', label:'Understand scoring', section:'play', parent:'/play-score/' },
  { id:'result', path:'/play-score/result-card/', title:'Tennis Match Result Card Creator', label:'Share a result', section:'play', parent:'/play-score/' },
  { id:'quiz', path:'/play-score/umpire-challenge/', title:'You’re the Umpire: Tennis Scoring Challenge', label:'You’re the Umpire', section:'play', parent:'/play-score/' },
  { id:'clubs', path:'/clubs-coaches/', title:'Organize Your Next Club Tennis Session', label:'Clubs & Coaches', section:'clubs', parent:'/' },
  { id:'rotation', path:'/clubs-coaches/rotation-planner/', title:'Social Tennis Rotation Planner for 2–32 Players', label:'Create a rotation schedule', section:'clubs', parent:'/clubs-coaches/' },
  { id:'rules', path:'/clubs-coaches/tournament-rules/', title:'Tennis Tournament Rules & Information Builder', label:'Tournament rules & information', section:'clubs', parent:'/clubs-coaches/tennis-kit/' },
  { id:'score-sheet', path:'/clubs-coaches/match-score-sheet/', title:'Tennis Match Score Sheet Builder: Singles & Doubles', label:'Match score sheet builder', section:'clubs', parent:'/clubs-coaches/tennis-kit/' },
  { id:'checklist', path:'/clubs-coaches/session-checklist/', title:'Tennis Checklists: Practice Sessions and Event Organizers', label:'Checklists', section:'clubs', parent:'/clubs-coaches/' },
  { id:'kit', path:'/clubs-coaches/tennis-kit/', title:'Printable Tennis Club Kit: Score Sheets and Schedules', label:'Printable club kit', section:'clubs', parent:'/clubs-coaches/' },
  { path:'/site-map/', title:'CourtUmpire site map', label:'Site map', section:'information', parent:'/' },
  // Preserve this URL as a small compatibility gateway, not another discovery hub.
  { path:'/tools/', title:'CourtUmpire resources have a new home', label:'Resources', section:'practice', parent:'/practice/', sitemap:false, htmlMap:false, canonical:'/practice/' },
  { path:'/404.html', title:'Page Not Found', label:'Page not found', section:'information', sitemap:false, htmlMap:false, noindex:true }
];
export const routeByPath = new Map(routeDefinitions.map(r=>[r.path,r]));
export function href(id) {
  const route=routeDefinitions.find(r=>r.id===id);
  if(!route) throw new Error('Unknown route identity '+id);
  return route.path;
}
export const publicPaths = routeDefinitions.map(r=>r.path);
export const canonicalPaths = routeDefinitions.filter(r=>r.sitemap!==false).map(r=>r.path);
export const canonicalUrl = route => productionOrigin + (routeByPath.get(route)?.canonical || route);
export function ancestors(route) {
  const result=[], seen=new Set();
  let current=routeByPath.get(route);
  while(current) {
    if(seen.has(current.path)) throw new Error('Circular breadcrumb parent');
    seen.add(current.path); result.unshift(current); current=routeByPath.get(current.parent);
  }
  return result;
}
