import fs from 'node:fs';
import {loadEditions,published} from '../weekly-core/store.mjs';
import {snapshot} from '../weekly-core/rankings.mjs';
import {readHistory} from '../weekly-core/ranking-store.mjs';
const paths=['authoring/index.html','authoring/editor.mjs','authoring/online.mjs','authoring/template.json','authoring/schema.json','assets/favicon-32.png','assets/favicon-192.png','assets/apple-touch-icon.png','styles.css','weekly/weekly.css','weekly/weekly.mjs','weekly/dates.mjs',...['contract','render','rankings','ranking-import','presentation','results'].map(n=>'weekly-core/'+n+'.mjs')];
const assets={};
for(const p of paths){
 const binary=p.endsWith('.png');
 let body=fs.readFileSync(p,binary?'base64':'utf8');
 if(p==='authoring/index.html'){
  body=body.replace('<head>','<head><meta name="private-editor-nonce" content="__CSP_NONCE__"><script type="module" src="/authoring/online.mjs"></script>')
   .replace(/<title>[^<]*<\/title>/,'<title>CourtUmpire — Private Editor</title>')
   .replace('</head>','<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=4"><link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png?v=4"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=4"></head>')
   .replace('Private local authoring','Private administration').replace('PRIVATE LOCAL AUTHORING','PRIVATE ADMINISTRATION')
   .replace('Files stay in this browser until you export.','Save private drafts to your authenticated account, or export a local copy.')
   .replace(/<details class="editor-demo-tools">[\s\S]*?<\/details>/,'')
   .replace(/<details[^>]*>\s*<summary>Clear, remove or unpublish an edition[\s\S]*?<\/details>/,'')
   .replace('<section id="import-step"',`<section class="editor-import-card" id="private-storage"><h2>Private drafts</h2><p id="private-identity"></p><p>Saving does not publish. Drafts and revisions stay until you explicitly delete them.</p><div class="toolbar"><button id="draft-save" type="button">Save private draft</button><button id="draft-refresh" type="button">Refresh saved drafts</button><a href="/admin">Moderation</a><a href="/cdn-cgi/access/logout">Sign out</a></div><p id="draft-status" role="status"></p><div id="draft-list"></div><button id="draft-more" hidden>More drafts</button><details><summary>Recover a saved revision</summary><div id="draft-history"></div><button id="history-more" hidden>More revisions</button></details></section><section id="import-step"`);
 }
 assets['/'+p]={body,...(binary?{encoding:'base64'}:{}),type:binary?'image/png':p.endsWith('.mjs')?'text/javascript; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':p.endsWith('.json')?'application/json':'text/html; charset=utf-8'};
}
assets['/authoring/ranking-context.json']={type:'application/json',body:JSON.stringify({snapshots:published(loadEditions()).map(snapshot),history:readHistory()})};
fs.writeFileSync('backend/private-admin/assets.generated.mjs','// Generated from an explicit static allowlist. No draft data.\nexport default '+JSON.stringify(assets)+';\n');
console.log('Built private admin assets; no drafts/rehearsal data included. No deployment.');

