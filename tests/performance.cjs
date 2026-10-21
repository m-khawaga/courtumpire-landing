// One controlled local mobile lab run per page; not field Core Web Vitals or a ranking score.
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const server=require('../scripts/preview.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const results=[],external=[];
 try{
  for(const route of ['/','/practice-planner/','/tennis-drills/crosscourt-rally/','/play-score/scoreboard/','/clubs-coaches/rotation-planner/']){
   const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
   await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(external.push(r.request().url()),r.abort()));
   const p=await c.newPage();const cdp=await c.newCDPSession(p);
   await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,connectionType:'cellular4g'});
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await p.addInitScript(()=>{
    window.lab={lcp:0,shifts:[]};new PerformanceObserver(list=>{for(const e of list.getEntries())window.lab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.lab.shifts.push({time:e.startTime,value:e.value});}).observe({type:'layout-shift',buffered:true});
   });
   await p.goto(origin+route,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.courtUmpireConsentLoaded&&!document.querySelector('[data-enhance][disabled]'));
   // Wait for browser-rendered paint entries, using animation frames instead of a time-based delay.
   await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const metrics=await p.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');
    let cls=0,windowValue=0,start=0,last=0;for(const s of window.lab.shifts){if(s.time-last>1000||s.time-start>5000){start=s.time;windowValue=0;}windowValue+=s.value;cls=Math.max(cls,windowValue);last=s.time;}
    return{fcpMs:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0),lcpMs:Math.round(window.lab.lcp),cls:Number(cls.toFixed(4)),requests:resources.length+1,transferredBytes:resources.reduce((sum,r)=>sum+r.transferSize,nav.transferSize),loadedScripts:resources.filter(r=>/\.(?:m?js)(?:\?|$)/.test(r.name)).map(r=>new URL(r.name).pathname),horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
   });assert.ok(metrics.fcpMs>0&&metrics.lcpMs>0&&!metrics.horizontalOverflow);results.push({route,...metrics});await c.close();
  }
  assert.equal(external.length,0);const report={environment:'Local Chrome, cold cache, 390×844, 4× CPU throttle, 150 ms latency, 1.6 Mbit/s downstream. One run per page. Consent unselected. Below-fold media not force-loaded.',limitations:'Local synthetic observations only; host compression/cache/CDN and real devices differ. No field INP or ranking claims. Chrome DevTools MCP unavailable; measurements collected through existing Playwright CDP.',results,externalRequests:external};
  const dir=path.resolve('.local-review/seo');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'mobile-performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
