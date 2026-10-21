// Audits the generated HTML with JavaScript disabled. All requests stay on loopback.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const server=require('../scripts/preview.cjs');
const output=path.resolve('.local-review/seo');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const {routeDefinitions,canonicalPaths,canonicalUrl,ancestors}=await import('../practice/routes.mjs');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const external=[];await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(external.push(r.request().url()),r.abort()));
 const page=await context.newPage(), titles=new Set(), descriptions=new Set(), internal=new Set(), pages=[];
 let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;};
 try{
  for(const def of routeDefinitions){
   const response=await page.goto(origin+def.path);check(response.status()===200,'generated file served '+def.path);
   const result=await page.evaluate(()=>({
    title:document.title,description:document.querySelector('meta[name=description]')?.content,
    canonicals:[...document.querySelectorAll('head link[rel=canonical]')].map(n=>n.href),
    robots:[...document.querySelectorAll('meta[name=robots],meta[name=googlebot]')].map(n=>n.content),
    h1:[...document.querySelectorAll('main h1')].map(n=>n.textContent.trim()),
    headings:[...document.querySelectorAll('main h1,main h2,main h3,main h4')].map(n=>[Number(n.tagName[1]),n.textContent]),
    main:document.querySelector('main')?.textContent,
    links:[...document.querySelectorAll('a[href]')].map(n=>({href:n.href,text:n.textContent.trim()||n.querySelector('img')?.alt})),
    media:[...document.querySelectorAll('img')].map(n=>({src:n.src,alt:n.getAttribute('alt'),width:n.getAttribute('width'),height:n.getAttribute('height')})),
    schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),
    ogTitle:document.querySelector('meta[property="og:title"]')?.content,
    ogDescription:document.querySelector('meta[property="og:description"]')?.content,
    ogUrl:document.querySelector('meta[property="og:url"]')?.content,
    twitterTitle:document.querySelector('meta[name="twitter:title"]')?.content,
    map:[...document.querySelectorAll('.html-site-map a')].map(n=>new URL(n.href).pathname)
   }));
   check(result.title&&!titles.has(result.title),'unique title '+def.path);titles.add(result.title);
   check(result.description&&!descriptions.has(result.description),'unique description '+def.path);descriptions.add(result.description);
   check(result.h1.length===1&&result.h1[0].length>5,'one useful main heading '+def.path);
   let previous=1;for(const [level,text] of result.headings){check(level<=previous+1,'logical heading level '+def.path+' '+text);previous=level;}
   check(result.ogTitle===result.title&&result.twitterTitle===result.title,'accurate social title '+def.path);
   check(result.ogDescription===result.description,'accurate social description '+def.path);
   const noindex=result.robots.some(v=>/\bnoindex\b|\bnone\b/i.test(v));
   if(def.noindex){check(noindex&&result.canonicals.length===0,'intentional missing-page exclusion');}
   else{assert.deepEqual(result.canonicals,[canonicalUrl(def.path)]);check(!noindex,'public page indexable '+def.path);check(result.ogUrl===canonicalUrl(def.path),'social canonical '+def.path);}
   const xRobots=response.headers()['x-robots-tag']||null;check(!xRobots||!/(noindex|none)/i.test(xRobots)||def.noindex,'no unexpected response noindex');
   for(const img of result.media)check(img.alt!==null&&+img.width>0&&+img.height>0,'media dimensions and alternative '+img.src);
   for(const a of result.links){check(a.text&&a.text.length>0,'meaningful link text '+a.href);if(new URL(a.href).origin===origin){check(a.href!==origin+def.path+'#','no placeholder anchors');internal.add(a.href);}}
   if(def.path.startsWith('/tennis-drills/')&&!['/tennis-drills/','/tennis-drills/1-player/','/tennis-drills/2-players/','/tennis-drills/3-players/','/tennis-drills/4-players/'].includes(def.path))
    for(const label of ['setup','How to play','Rotation','Scoring','Make it easier','Add a challenge'])check(result.main.toLowerCase().includes(label.toLowerCase()),'initial drill instructions '+label+' '+def.path);
   if(def.section==='play'&&def.path!=='/play-score/'||def.section==='clubs'&&def.path!=='/clubs-coaches/')check(/Example|example/.test(result.main),'initial useful tool example '+def.path);
   for(const schema of result.schemas){check(!/VideoObject|Product|AggregateRating|Review/.test(JSON.stringify(schema)),'no unsupported structured data');if(schema['@type']==='BreadcrumbList')assert.deepEqual(schema.itemListElement.map(i=>i.item),ancestors(def.path).map(d=>canonicalUrl(d.path)));}
   if(def.path==='/site-map/'){const mapped=new Set(result.map);check(canonicalPaths.every(p=>mapped.has(p)),'HTML map covers available canonicals');check(!mapped.has('/404.html')&&!mapped.has('/tools/'),'HTML map preserves exclusions');await page.screenshot({path:path.join(output,'site-map-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(output,'site-map-desktop.png'),fullPage:true});}
   pages.push({path:def.path,status:response.status(),canonical:result.canonicals[0]||null,robots:result.robots,xRobotsTag:xRobots,xmlIncluded:canonicalPaths.includes(def.path),policy:def.noindex?'intentional noindex':def.canonical?'compatibility canonical':'self canonical'});
  }
  for(const link of internal){const u=new URL(link);const response=await fetch(link,{redirect:'manual'});check(response.status===200,'direct internal destination '+u.pathname);if(u.hash){const html=await response.text();check(html.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),'existing fragment '+link);}check(u.pathname!=='/index.html','internal home links use canonical path');}
  const xml=await(await fetch(origin+'/sitemap.xml')).text();const parsed=await page.evaluate(xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');return {valid:!d.querySelector('parsererror'),namespace:d.documentElement.namespaceURI,urls:[...d.querySelectorAll('loc')].map(n=>n.textContent)};},xml);
  check(parsed.valid&&parsed.namespace==='http://www.sitemaps.org/schemas/sitemap/0.9','valid XML sitemap');assert.deepEqual(parsed.urls,canonicalPaths.map(canonicalUrl));
  const robots=await(await fetch(origin+'/robots.txt')).text();check(robots.includes('Sitemap: https://courtumpire.com/sitemap.xml')&&!/Disallow:\s*\/$/m.test(robots),'robots preserves XML destination and crawling');
  const redirects=[];for(const p of canonicalPaths.filter(p=>p!=='/'&&p.endsWith('/'))){const response=await fetch(origin+p.slice(0,-1),{redirect:'manual'});check(response.status===301&&response.headers.get('location')===p,'correct trailing-slash redirect '+p);redirects.push({from:p.slice(0,-1),status:301,to:p});}
  for(const variant of ['/index.html','/practice-planner/index.html','/practice-planner/?ads=preview','/play-score/scoreboard/?session=personal']){await page.goto(origin+variant);const actual=await page.locator('link[rel=canonical]').getAttribute('href');check(actual===canonicalUrl(variant.startsWith('/play-score/')?'/play-score/scoreboard/':variant.startsWith('/practice-planner/')?'/practice-planner/':'/'),'duplicate variant clean canonical '+variant);}
  const missing=await page.goto(origin+'/nonexistent/deep-page/');check(missing.status()===404,'real missing-page status');check((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'),'missing noindex retained');check(await page.locator('link[rel=canonical]').count()===0,'missing does not canonicalize to home');
  check(external.length===0,'no third-party requests');
  const report={scope:'Generated local HTML and loopback HTTP responses only; not live hosting or Search Console',reportedCases:{redirected:2,noindex:1,duplicateWithoutUserCanonical:1,affectedURLsAvailable:false,resolved:false},checks,canonicalPages:parsed.urls.length,internalLinks:internal.size,pages,redirects,headerConfigurationFiles:['_headers','.htaccess','netlify.toml','vercel.json'].filter(f=>fs.existsSync(f)),hostingFollowup:'Fetch actual affected URLs and full redirect chains, final status, X-Robots-Tag and Link headers on production. Static files cannot validate or alter upstream headers. Preserve intentional redirects/noindex. Compare Google-selected and user canonical in URL Inspection.',externalRequests:external};
  fs.writeFileSync(path.join(output,'indexing-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks,canonicalPages:parsed.urls.length,internalLinks:internal.size,reportedCases:report.reportedCases,externalRequests:external},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
