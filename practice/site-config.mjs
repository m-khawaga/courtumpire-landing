import { href } from './routes.mjs';
export const playUrl = 'https://play.google.com/store/apps/details?id=com.mahmoud.courtvoice';
// Shared by static page generation. Add future navigation entries here only once real pages exist.
export const navigation = [
  { label:'The App', href:href('home')+'#features' },
  { label:'Practice', section:'practice', href:href('practice'), children:[
    { label:'Practice overview', href:href('practice') },
    { label:'Build a practice', href:href('planner') },
    { label:'Find a drill', href:href('drills') },
    { label:'Practice for 1–4 players', href:href('players') }
  ] },
  { label:'Play & Score', section:'play', href:href('play'), children:[
    { label:'Play & Score overview', href:href('play') },
    { label:'Score a match', href:href('scoreboard') },
    { label:'Understand scoring', href:href('helper') },
    { label:'Share a result', href:href('result') },
    { label:'You’re the Umpire', href:href('quiz') }
  ] },
  { label:'Clubs & Coaches', section:'clubs', href:href('clubs'), children:[
    { label:'Clubs & Coaches overview', href:href('clubs') },
    { label:'Create a rotation schedule', href:href('rotation') },
    { label:'Printable club kit', href:href('kit') },
    { label:'Tournament rules & information', href:href('rules') },
    { label:'Match score sheet builder', href:href('score-sheet') },
    { label:'Checklists', href:href('checklist') }
  ] },
  { label:'Weekly', href:'/weekly/' },
  { label:'Get the App', href:playUrl, app:true }
];
export { playerPages } from './player-pages.mjs';
