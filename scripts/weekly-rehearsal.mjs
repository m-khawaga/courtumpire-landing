import fs from 'node:fs';
import {assertValid} from '../weekly-core/contract.mjs';
import {rankingErrors} from '../weekly-core/rankings.mjs';
import {article,archive,teaser,editionPath} from '../weekly-core/render.mjs';
const root='.weekly-private/rehearsal',a=assertValid(JSON.parse(fs.readFileSync(root+'/article.json','utf8')));
if(a.status!=='draft'||a.editionNumber!==null||a.publishedAt!==null||a.updatedAt!==null)throw Error('Rehearsal must remain an unpublished draft.');
if(rankingErrors(a,null).length)throw Error('Resolve ranking comparisons before rehearsal.');
const banner='<aside class="weekly-preview" role="note">Local preview — unpublished article; sample engagement.</aside>';
const links='<nav class="container weekly-actions" aria-label="Local rehearsal"><a href="/rehearsal/">Home preview</a><a href="/rehearsal/weekly/">Weekly preview</a><a href="/rehearsal/article/">Reader article</a><a href="/authoring/">Editor</a><a href="http://127.0.0.1:8797/admin">Local moderation</a></nav>';
function privatePage(html){return html.replace(/<script[^>]*src="[^\"]*analytics\.js"[^>]*><\/script>/g,'').replace(/<link[^>]*rel="canonical"[^>]*>/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'').replace('</head>','<meta name="robots" content="noindex,nofollow"></head>').replace(/<body\b[^>]*>/,match=>match+banner+links).replaceAll('href="'+editionPath(a)+'"','href="/rehearsal/article/"').replaceAll('href="/weekly/"','href="/rehearsal/weekly/"').replaceAll('href="/"','href="/rehearsal/"').replaceAll('src="assets/','src="/assets/');}
let home=fs.readFileSync('dist/index.html','utf8').replace('<section class="section" id="practice-resources">',teaser(a)+'<section class="section" id="practice-resources">');
home=home.replace('</head>','<link rel="stylesheet" href="/weekly/weekly.css"></head>');fs.writeFileSync(root+'/home.html',privatePage(home));
const shell=fs.readFileSync('dist/weekly/index.html','utf8');const page=body=>privatePage(shell.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main class="container weekly-page" id="main-content" tabindex="-1">${body}</main>`).replace('<title>CourtUmpire Weekly','<title>Local rehearsal — CourtUmpire Weekly'));
fs.writeFileSync(root+'/archive.html',page(archive([a]).replace('Latest & previous editions','Local draft rehearsal').replace('Subscribe via RSS','Published-edition RSS (this draft is excluded)')));
fs.writeFileSync(root+'/reader.html',page(article(a,{comparisonUnknown:true,config:{apiOrigin:'http://127.0.0.1:8797',turnstileSiteKey:'local-demo'}})).replace('</head>','<script type="module" src="/weekly/weekly.mjs"></script></head>'));
fs.writeFileSync(root+'/active.json',JSON.stringify({id:a.id,path:'/rehearsal/article/',label:'Local preview — unpublished article; sample engagement.'}));
console.log('Private rehearsal prepared: /rehearsal/, /rehearsal/weekly/, /rehearsal/article/. No public sources changed.');
