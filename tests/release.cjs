// Focused release regressions: hostile local text, builder recovery and local logos.
const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const server=require('../scripts/preview.cjs');
const out=path.resolve('.local-review/release-audit');fs.mkdirSync(out,{recursive:true});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),external=[],errors=[],dialogs=[];let checks=0;
 const check=(value,label)=>{assert.ok(value,label);checks++;};
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():(external.push(route.request().url()),route.abort()));
 page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>{dialogs.push(dialog.message());dialog.dismiss();});
 const open=async route=>{await page.goto(origin+route);await page.waitForFunction(()=>document.body.dataset.toolsReady==='true'||document.body.dataset.practiceReady==='true'||document.body.dataset.contactReady==='true');};
 const fill=async values=>{for(const [name,value]of Object.entries(values)){const field=page.locator(`[name="${name}"]`);if(await field.evaluate(n=>n.tagName)==='SELECT')await field.selectOption(String(value));else await field.fill(String(value));}};
 const clean=async selector=>{check(!await page.evaluate(()=>window.__auditXss),'no hostile text execution');check(await page.locator(selector+' img[src="x"],'+selector+' script').count()===0,'no hostile text rendered as markup');};
 const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 const payload='<img src=x onerror=window.__auditXss=1>';
 try{
  await page.goto(origin+'/contact.html');await page.locator('[data-choice=rejected]').click();
  await open('/tennis-drills/?search='+encodeURIComponent(payload));check((await page.locator('#result-count').textContent()).includes('0 activit'),'hostile URL search remains a search');await clean('#results');
  await open('/play-score/scoreboard/');await fill({a:payload,b:'Audit Player B',format:'one-set',gamesPerSet:4,first:1});await page.getByRole('button',{name:'Start new match',exact:true}).click();
  check((await page.locator('#scoreboard').textContent()).includes(payload),'player name preserved as text');await clean('#scoreboard');await page.reload();await page.waitForFunction(()=>document.body.dataset.toolsReady==='true');await clean('#scoreboard');check((await page.locator('.sr-only').allTextContents()).some(t=>t.includes('Audit Player B is serving')),'configured starting server restored');
  await open('/clubs-coaches/session-checklist/');await fill({text:payload});await page.locator('#checklist-add button').click();await clean('#checklist-items');check((await page.locator('#checklist-items').textContent()).includes(payload),'custom reminder preserved as text');
  await page.evaluate(()=>window.print=()=>{});await page.locator('#checklist-print').click();await page.waitForSelector('#print-report',{state:'attached'});await clean('#print-report');check((await page.locator('#print-report').textContent()).includes(payload),'print escapes reminder text');await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  await open('/clubs-coaches/rotation-planner/');await fill({'event-name':payload,names:[payload,'Audit B','Audit C','Audit D','Audit E','Audit F','Audit G','Audit H'].join('\n'),first:1,last:3,mode:'doubles',duration:'01:10',round:'00:10',changeover:2,preference:'maximize'});
  const generate=()=>page.getByRole('button',{name:'Generate rotation schedule',exact:true}).click();await generate();await clean('#rotation-output');
  check((await page.locator('.court-use').textContent()).includes('Using 2 of your 3'),'insufficient players leave spare court unused');check((await page.locator('#rotation-output').textContent()).includes('6 rounds'),'duration mode fits six rounds');
  await fill({preference:'rest'});check(await page.locator('[data-print-rotation]').isDisabled(),'changed settings invalidate print');await generate();check((await page.locator('.court-use').textContent()).includes('Using 1 of your 3'),'rest preference leaves one complete active court');check((await page.locator('.court-use').textContent()).includes('4 participants rest'),'explicit rests retained');
  await fill({planningMode:'rounds',roundCount:3});await generate();check((await page.locator('#rotation-output').textContent()).includes('34 minutes'),'round-count duration includes only between-round breaks');
  await fill({planningMode:'duration',duration:'00:01'});await generate();check(await page.locator('#rotation-output button').count()===0,'invalid duration clears stale output/actions');check((await page.locator('#tool-status').textContent()).length>15,'invalid duration provides recovery explanation');
  await fill({duration:'01:10','event-name':'Audit event',names:'Audit A\nAudit B\nAudit C\nAudit D\nAudit E\nAudit F\nAudit G\nAudit H'});await generate();await shot('rotation-mobile');
  await open('/clubs-coaches/tournament-rules/');await fill({discipline:'doubles','shared-setLength':4,'shared-scoring':'no-ad',reporting:payload,notes:payload});await clean('#rules-preview');
  check((await page.locator('#rules-preview').textContent()).includes('4–4'),'four-game rules have correct trigger');check((await page.locator('#rules-preview').textContent()).includes('no-ad games'),'game scoring remains independently selected');check((await page.locator('#rules-preview').textContent()).includes(payload),'organizer notes escaped');
  await fill({reporting:''});check(await page.locator('#rules-print').isDisabled(),'invalid rules disable print');await fill({reporting:'Report the completed result to the organizer.',notes:'Audit sample only.'});check(await page.locator('#rules-print').isEnabled(),'corrected rules restore print');
  await open('/clubs-coaches/match-score-sheet/');await fill({nameMode:'prefilled',discipline:'doubles',gamesPerSet:4,format:'match-tiebreak',a1:payload,a2:'Audit A2',b1:'Audit B1',b2:'Audit B2',server:payload});await clean('#sheet-preview');
  const sheet=await page.locator('#sheet-preview').textContent();check(sheet.includes('4–4')&&sheet.includes('Points')&&sheet.includes('TB points (optional)'),'doubles sheet distinguishes games, set TB and deciding points');check(sheet.includes(payload),'team/service names escaped');
  for(const type of ['png','jpeg','webp']){const bytes=await sharp('assets/sponsor-sample.svg').resize(240,80,{fit:'contain'}).toFormat(type).toBuffer();await page.locator('[data-club-logo]').setInputFiles({name:'audit.'+type,mimeType:'image/'+type,buffer:bytes});await page.waitForFunction(()=>document.querySelector('[data-logo-status]').textContent.includes('Logo ready'));check(await page.locator('[data-logo-preview]').isVisible(),type+' processed locally');}
  const prior=await page.evaluate(()=>localStorage.getItem('courtumpire.club-logo.v1'));check(!prior.includes('audit.webp'),'saved processed logo excludes original filename');
  for(const file of [{name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')},{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')},{name:'huge.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)}]){
   await page.locator('[data-club-logo]').setInputFiles(file);await page.waitForFunction(()=>!/Processing/.test(document.querySelector('[data-logo-status]').textContent));check(await page.evaluate(()=>localStorage.getItem('courtumpire.club-logo.v1'))===prior,'rejected logo preserves valid prior image');
  }
  await shot('score-sheet-mobile');await page.locator('[data-remove-logo]').click();check(await page.evaluate(()=>localStorage.getItem('courtumpire.club-logo.v1'))===null,'logo removal clears saved image');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});for(const route of ['/clubs-coaches/rotation-planner/','/clubs-coaches/tournament-rules/','/clubs-coaches/match-score-sheet/']){await open(route);check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no ordinary content overflow '+width+' '+route);}}
  check(external.length===0,'no analytics, uploads or external requests');check(errors.length===0,'no browser errors');check(dialogs.length===0,'no unexpected dialogs or script execution');
  const report={checks,externalRequests:external,pageErrors:errors,unexpectedDialogs:dialogs,coverage:['hostile names/reminders/event/URL/notes','reload and print text safety','duration/round count/spare courts/rests','builder validation recovery','PNG/JPEG/WebP and rejected SVG/mismatch/oversize','320/390/1440 overflow'],axeAvailable:false,physicalDeviceTested:false};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
