import {track} from './usage.mjs';
import { tiebreakSituation,normalSituation } from './scoring.mjs';
import { printDocument } from './print.mjs';
import { escape as e } from '../practice/html.mjs';
const $=s=>document.querySelector(s),kind=document.body.dataset.page;
const tell=text=>{const node=$('#tool-status');if(node)node.textContent=text;};
function read(key){try{return {raw:localStorage.getItem(key),available:true};}catch{return {raw:null,available:false};}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
document.querySelectorAll('[data-enhance]').forEach(n=>n.disabled=false);
for(const src of ['/assets/report-logo.webp','/assets/website-qr.svg']){const image=new Image();image.src=src;}
window.addEventListener('afterprint',()=>{document.getElementById('print-report')?.remove();document.documentElement.style.removeProperty('--report-label');});
const storageWarning='Browser storage is unavailable. This visit still works; copy or print what you need before leaving.';

if(kind==='scoreboard') (await import('./scoreboard.mjs')).initScoreboard();
if(kind==='helper') (await import('./helper-controller.mjs')).initHelper();
if(kind==='result') (await import('./result-editor.mjs')).initResultEditor();
if(kind==='quiz') (await import('./quiz-controller.mjs')).initQuiz();
if(kind==='rotation') (await import('./rotation-controller.mjs')).initRotation();
if(['rules','score-sheet'].includes(kind)) (await import('./club-controller.mjs')).initClubDocument(kind);
if(kind==='checklist') (await import('./checklist-controller.mjs')).initChecklists();
if(kind==='kit') (await import('./kit-controller.mjs')).initKit();

document.body.dataset.toolsReady="true";
