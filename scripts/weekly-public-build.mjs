// One-time Worker build assets, never a per-article deployment.
import fs from 'node:fs';
let shell=fs.readFileSync('weekly/index.html','utf8');
shell=shell.replace(/<title>[\s\S]*?<\/title>/,'<title>__TITLE__</title>').replace(/<meta (?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,'').replace(/<link rel="(?:canonical|alternate)"[^>]*>/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'').replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/,'$1__BODY__</main>').replace('</head>','__HEAD__<script type="module" src="/weekly/weekly.mjs"></script></head>');
const assets={};for(const [url,file,type]of [['/weekly/weekly.css','weekly/weekly.css','text/css'],['/weekly/weekly.mjs','weekly/weekly.mjs','text/javascript'],['/weekly/engagement.mjs','weekly/engagement.mjs','text/javascript'],['/weekly/dates.mjs','weekly/dates.mjs','text/javascript'],['/weekly/privacy/','weekly/privacy/index.html','text/html']])assets[url]={body:fs.readFileSync(file,'utf8'),type};
const staticSitemap=fs.readFileSync('sitemap.xml','utf8').replace(/<url><loc>https:\/\/courtumpire.com\/weekly\/[\s\S]*?<\/url>/g,'');
fs.writeFileSync('backend/src/public-assets.generated.mjs','// Generated public allowlist only.\nexport const shell='+JSON.stringify(shell)+';\nexport const assets='+JSON.stringify(assets)+';\nexport const staticSitemap='+JSON.stringify(staticSitemap)+';\n');
console.log('Built public Worker shell/assets. No content/drafts included; nothing deployed.');

fs.appendFileSync('backend/src/public-assets.generated.mjs','export const analytics='+JSON.stringify(fs.readFileSync('analytics.js','utf8'))+';\n');
