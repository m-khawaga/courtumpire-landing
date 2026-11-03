// Local test assets only; never a production content build or publication.
const fs=require('node:fs'),path=require('node:path');
(async()=>{
const web=process.cwd(),output=path.resolve(process.argv[2]||'.local-review/phone-webview-fixtures');
if(output===web||output===path.join(web,'dist'))throw Error('Choose a dedicated fixture directory');
fs.mkdirSync(output,{recursive:true});
function copy(relative){const from=path.join(web,'dist',relative),to=path.join(output,relative);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
function modules(dir){for(const entry of fs.readdirSync(path.join(web,'dist',dir),{withFileTypes:true})){const relative=dir+'/'+entry.name;if(entry.isDirectory())modules(relative);else if(/\.(?:mjs|js|css|json|svg)$/.test(relative))copy(relative);}}
for(const dir of ['practice','tools','weekly'])modules(dir);
for(const relative of ['styles.css','analytics.js','tennis-drills/index.html','practice-planner/index.html','play-score/result-card/index.html','weekly/index.html'])copy(relative);
const assets=path.join(web,'dist/assets');
function smallAssets(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const from=path.join(dir,entry.name);if(entry.isDirectory())smallAssets(from);else if(/\.(?:svg|png|webp|ico|woff2?)$/.test(from)&&fs.statSync(from).size<200000)copy(path.relative(path.join(web,'dist'),from));}}
smallAssets(assets);
const localLinks='<p id="fixture-links"><a id="fixture-weekly" href="/weekly/">Local fixture archive</a> · <a id="fixture-article" href="/weekly/local-fixture/">Local fictional article</a> · <a id="fixture-planner" href="/practice-planner/">Local planner fixture</a></p>';
for(const relative of ['tennis-drills/index.html','practice-planner/index.html','weekly/index.html']){
 const p=path.join(output,relative);let html=fs.readFileSync(p,'utf8');html=html.replace('</main>',localLinks+'</main>');fs.writeFileSync(p,html);
}
const {fixture}=await import('../tests/weekly-fixture.mjs');
const {article,archive}=await import('../weekly-core/render.mjs');
const a=fixture();a.slug='local-fixture';a.title='Fictional Practice Cup';
const b=structuredClone(a);b.slug='local-fixture-b';b.title='New local fixture edition';b.id='cu-weekly-2026-10-30';b.issueDate='2026-10-30';
const shell=fs.readFileSync(web+'/dist/weekly/index.html','utf8');
const wrap=body=>shell.replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/,(_all,start)=>start+body+localLinks+'</main>');
for(const edition of [a,b]){fs.mkdirSync(output+'/weekly/'+edition.slug,{recursive:true});fs.writeFileSync(output+'/weekly/'+edition.slug+'/index.html',wrap(article(edition,{preview:true})));}
fs.writeFileSync(output+'/weekly/index.html',wrap(archive([a])));
fs.writeFileSync(output+'/fixture-archive-after.html',wrap(archive([b,a])));
fs.mkdirSync(output+'/clubs-coaches/fixture-redirect',{recursive:true});fs.writeFileSync(output+'/clubs-coaches/fixture-redirect/index.html','<!doctype html><meta name="viewport" content="width=device-width"><script>location.replace("/practice-planner/")</script>');

console.log('Prepared local HTTPS-interception fixtures at '+output+' (fictional articles; no publication).');
})().catch(error=>{console.error(error);process.exitCode=1});
