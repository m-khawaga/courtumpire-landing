const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const server=require('../scripts/preview.cjs');
const output=path.resolve('.local-review/refinement');fs.mkdirSync(output,{recursive:true});
function luminance(rgb){const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}});
 const external=[],errors=[];await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(external.push(r.request().url()),r.abort()));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;};
 const open=async route=>{await page.goto(origin+route);await page.waitForFunction(()=>window.courtUmpireConsentLoaded);};
 const shot=name=>page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
 try{
  if(!process.env.PDF_ONLY) for(const width of [390,1440]){
   await page.setViewportSize({width,height:1000});const suffix=width===390?'mobile':'desktop';
   await open('/');check(await page.locator('#practice-resources').count()===1,'single homepage practice section');check(await page.locator('.feature-grid').count()===1,'single app feature grid');
   check(await page.locator('nav').getByText('Play & Score',{exact:true}).count()===1,'implemented score tools available');check(await page.locator('nav').getByText('Shop',{exact:true}).count()===0,'shop hidden');
   const practice=page.locator('.nav-group').filter({has:page.getByText('Practice',{exact:true})});
   await practice.locator('summary').focus();await page.keyboard.press('Enter');check(await practice.locator('a').first().isVisible(),'hierarchy opens with keyboard');
   await page.keyboard.press('Escape');check(await practice.evaluate(n=>!n.open),'Escape closes menu');
   await practice.locator('summary').click();await practice.getByRole('link',{name:'Practice overview'}).click();check(new URL(page.url()).pathname==='/practice/','touch/click submenu navigates');
   await open('/');
   const cta=page.locator('.home-intro .button');
   async function contrast(label){const c=await cta.evaluate(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor}));const a=luminance(c.fg),b=luminance(c.bg);check((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`CTA contrast ${label}`);}
   await contrast('default');await cta.hover();await contrast('hover');await cta.focus();await contrast('focus');
   await cta.evaluate(n=>n.addEventListener('click',e=>e.preventDefault(),{once:true}));await page.mouse.down();await contrast('active');await page.mouse.up();
   // A primary action remains legible after a visited navigation too.
   await cta.click();await page.goBack();await contrast('visited');await page.mouse.move(0,0);
   await shot('home-'+suffix);await page.screenshot({path:path.join(output,'home-intro-'+suffix+'.png'),fullPage:false});
   for(const [route,name] of [['/practice/','practice'],['/clubs-coaches/','clubs'],['/site-map/','site-map']]){await open(route);await shot(name+'-'+suffix);check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no section overflow');}
   await open('/practice/');
   const actions=await page.locator('.task-card .card-actions').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().top));if(width===1440)check(Math.abs(actions[0]-actions[1])<1,'desktop card actions aligned');
   await open('/tennis-drills/');const rows=await page.locator('.activity-card .card-actions').evaluateAll(ns=>ns.slice(0,3).map(n=>n.getBoundingClientRect().top));if(width===1440)check(Math.max(...rows)-Math.min(...rows)<1,'drill actions aligned');
   await page.locator('.site-header .nav-group').first().locator('summary').click();await shot('navigation-'+suffix);
  }
  const {generate,defaults}=await import('../practice/core.mjs');
  const short={version:1,settings:{...defaults,players:1,duration:15,goal:'Technique practice',focus:'Movement'},blocks:[{id:'shadow-recovery',minutes:15}],edited:true};
  const multi=generate({...defaults,players:4,duration:90,level:'Mixed',focus:'Doubles teamwork'});
  for(const [name,session] of [['short',short],['multipage',multi]]){
   await open('/practice-planner/');await page.evaluate(s=>localStorage.setItem('courtumpire.practice.v1',JSON.stringify(s)),session);await page.reload();await page.waitForSelector('.session-block');
   await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
   await page.locator('#print-report img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
   await page.emulateMedia({media:'print'});
   check(await page.locator('#print-report').isVisible(),'report visible');check(await page.locator('.planner-form').isHidden(),'editing controls excluded');check(await page.locator('.site-header').isHidden(),'navigation excluded');
   check(await page.locator('#print-report .report-activity').count()===session.blocks.length,'all report activities');check(await page.locator('#print-report [data-ad-slot]').count()===0,'no report ads');
   check((await page.locator('.report-metadata').textContent()).includes(session.settings.focus),'focus in report');
   await page.pdf({path:path.join(output,`courtumpire-${name}.pdf`),format:'A4',preferCSSPageSize:true,printBackground:false,displayHeaderFooter:false});
   await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));check(await page.locator('#print-report').count()===0,'print report removed after printing');
  }
  // Native print from courtside includes the full plan and restores the active view.
  await page.getByRole('button',{name:'Start session',exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));check(await page.locator('#print-report .report-activity').count()===3,'courtside print has full session');
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));check((await page.locator('.courtside-header').textContent()).includes('Activity 2'),'courtside position restored');
  const sitemap=await page.evaluate(async()=>{const text=await(await fetch('/sitemap.xml')).text();const xml=new DOMParser().parseFromString(text,'application/xml');return{error:!!xml.querySelector('parsererror'),namespace:xml.documentElement.namespaceURI,urls:[...xml.querySelectorAll('loc')].map(n=>n.textContent)};});
  const {canonicalPaths,canonicalUrl}=await import('../practice/routes.mjs');assert.deepEqual(sitemap.urls,canonicalPaths.map(canonicalUrl));check(!sitemap.error&&sitemap.namespace==='http://www.sitemaps.org/schemas/sitemap/0.9','actual sitemap valid XML');
  for(const url of sitemap.urls){check(new URL(url).origin==='https://courtumpire.com'&&!/[?#]/.test(url),'canonical production URL only');const r=await fetch(origin+new URL(url).pathname);check(r.ok,'canonical maps to local generated path');}
  check(!sitemap.urls.some(u=>/\/tools\/|shop|preview|localhost|ads=|404\.html/.test(new URL(u).pathname)),'drafts and compatibility gateway excluded');
  await open('/site-map/');
  const mapLinks=await page.locator('.html-site-map a').evaluateAll(ns=>ns.map(n=>n.href));
  const mapped=new Set(mapLinks.map(url=>new URL(url).pathname==='/index.html'?'/':new URL(url).pathname));
  check(canonicalPaths.every(p=>mapped.has(p)),'HTML map covers every available canonical page');
  check(!mapLinks.some(u=>new URL(u).search || new URL(u).pathname==='/tools/' || new URL(u).pathname.includes('shop')),'HTML map excludes drafts, aliases, previews and sessions');
  for(const url of mapLinks){const link=new URL(url);const r=await fetch(origin+link.pathname);check(r.ok,'HTML map link resolves');if(link.hash)check((await r.text()).includes(`id="${link.hash.slice(1)}"`),'HTML map anchor exists');}
  for(const p of canonicalPaths){await open(p);check(await page.locator('.site-footer a[href="/site-map/"]').count()===1,'shared footer site map '+p);}
  check(external.length===0,'no external requests');check(errors.length===0,'no page errors');
  const result={checks,canonicalPages:sitemap.urls.length,localPathsVerified:true,externalRequests:external,errors,appReference:'C:/05_CourtVoice/app/src/main/java/com/mahmoud/courtvoice/ui/match/MatchReportExporter.kt',pdfBackgroundGraphics:false};fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
