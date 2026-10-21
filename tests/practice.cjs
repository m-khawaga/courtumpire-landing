const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const server = require('../scripts/preview.cjs');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'.local-review');
const screenshots = path.join(output,'screenshots');
fs.mkdirSync(screenshots,{recursive:true});
const routes = JSON.parse(fs.readFileSync(path.join(root,'practice/routes.json'),'utf8'));
const KEY = 'courtumpire.practice.v1';
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL}:{})});
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  const external=[],errors=[],failed=[],requests=[];
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin) return route.continue();
    external.push(url.href); return route.abort();
  });
  const page = await context.newPage();
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  let checks=0;
  const check=(v,label)=>{assert.ok(v,label);checks++;};
  const open=async route=>{const response=await page.goto(origin+route);assert.equal(response.status(),200);await page.waitForFunction(()=>window.courtUmpireConsentLoaded); await page.waitForFunction(()=>!['planner','library','activity','players'].includes(document.body.dataset.page)||document.body.dataset.practiceReady==='true');};
  const screenshot=async name=>page.screenshot({path:path.join(screenshots,name+'.png'),fullPage:true});
  try {
    // All routes resolve directly, with original visible content and no ad DOM/gaps/requests.
    for(const width of [360,390,768,1440]) {
      await page.setViewportSize({width,height:1000});
      for(const route of routes) {
        await open(route);
        check(await page.locator('h1').count()===1,`one heading ${route}`);
        check(await page.locator('[data-ad-slot]').count()===0,`off has no ad node ${route}`);
        const result=await page.evaluate(async()=>{
          for(const img of document.images){img.loading='eager';await img.decode().catch(()=>{});}
          return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),canonical:document.querySelector('link[rel=canonical]')?.href || null};
        });
        check(!result.overflow,`no horizontal overflow ${width} ${route}`);
        check(!result.broken.length,`all images load ${route}`);
        assert.equal(result.canonical,route==='/404.html'?null:'https://courtumpire.com'+(route==='/tools/'?'/practice/':route));
      }
    }
    check(external.length===0,'no external advertising or analytics requests on local pages');
    check(!requests.some(url=>url.endsWith('/practice/ads.mjs')),'off never imports advertising renderer');
    check(errors.length===0,'no page errors'); check(failed.length===0,'no missing local resources');
    // Check links, including legacy app anchors, across all generated pages.
    const allLinks = new Set();
    for(const route of routes) {
      await open(route);
      for(const link of await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href))) if(new URL(link).origin===origin) allLinks.add(link);
    }
    for(const link of allLinks) {
      const response=await fetch(link); check(response.ok,'internal link '+link);
      const hash=new URL(link).hash;
      if(hash) check((await response.text()).includes(`id="${decodeURIComponent(hash.slice(1))}"`),'existing anchor '+link);
    }
    await open('/tennis-drills/');
    await page.getByLabel('Search activities').fill('zzzz'); check(await page.locator('.activity-card').count()===0,'helpful empty state');
    check(await page.getByText('No activities match yet.').isVisible(),'empty explanation');
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.locator('select[name=players]').selectOption('3'); check(await page.locator('.activity-card').count()===4,'3-player filter');
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.locator('select[name=focus]').selectOption('Down the line'); check(await page.locator('.activity-card').count()===1,'focus filter');
    // Library conflict is explicit; nothing is overwritten until resolution is selected.
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.locator('[data-add=solo-serve-targets]').click();
    check(await page.getByRole('button',{name:'Start new compatible session'}).isVisible(),'incompatible count resolution');
    check(await page.evaluate(key=>localStorage.getItem(key),KEY)===null,'conflict does not silently persist incompatible session');
    await page.getByRole('button',{name:'Start new compatible session'}).click();
    await open('/practice-planner/'); check(await page.locator('.session-block').count()===1,'library addition restores in planner');
    check((await page.locator('#session-summary').textContent()).includes('1 player'),'correct session count');
    page.on('dialog',dialog=>dialog.accept());
    for(const players of ['1','2','3','4']) {
      await page.locator('select[name=players]').selectOption(players);
      await page.locator('select[name=duration]').selectOption('45');
      await page.getByRole('button',{name:'Generate my plan'}).click();
      check((await page.locator('.plan-total').textContent()).includes('45 planned / 45 target'),'exact browser total '+players);
      const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
      check(saved.settings.players===Number(players)&&saved.blocks.length===3,'saved plan '+players);
      await page.reload(); await page.waitForSelector('.session-block'); check(await page.locator('.session-block').count()===3,'restore '+players);
    }
    const before=await page.locator('.session-block h3').first().textContent();
    await page.locator('[data-down="0"]').click(); check(await page.locator('.session-block h3').first().textContent()!==before,'reorder');
    const minutes=page.locator('[data-minutes="0"]'); await minutes.fill('20'); await minutes.press('Tab');
    check(!(await page.locator('.plan-total').textContent()).includes('45 planned / 45 target'),'manual edit totals are honest');
    // A compatible unused alternative can be swapped without changing duration.
    await page.locator('select[name=players]').selectOption('2');
    await page.locator('select[name=level]').selectOption('Intermediate');
    await page.getByRole('button',{name:'Generate my plan'}).click();
    const swap=page.locator('[data-swap]:not([disabled])').first();
    const swapIndex=await swap.getAttribute('data-swap');
    const oldTitle=await page.locator(`[data-block="${swapIndex}"] h3`).first().textContent();
    await swap.click(); check(await page.locator(`[data-block="${swapIndex}"] h3`).first().textContent()!==oldTitle,'compatible swap changes activity');
    check((await page.locator('.plan-total').textContent()).includes('45 planned / 45 target'),'swap preserves total');
    await page.locator('[data-remove="2"]').click(); check(await page.locator('.session-block').count()===2,'remove activity');
    await page.locator('select[name=players]').selectOption('4');
    await page.locator('select[name=level]').selectOption('Beginner');
    await page.getByRole('button',{name:'Generate my plan'}).click();
    // Copy fallback is selectable if clipboard is denied.
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true}));
    await page.getByRole('button',{name:'Copy session summary'}).click(); check(await page.getByLabel('Session summary to copy').isVisible(),'clipboard fallback');
    // Courtside has no placements even when preview is requested, and full instructions are open.
    await page.getByRole('button',{name:'Start session',exact:true}).click();
    check(await page.locator('body.courtside').count()===1,'courtside active'); check(await page.locator('.session-block').count()===1,'one activity at a time');
    check(await page.locator('.session-block details').evaluate(el=>el.open),'instructions open'); check(await page.locator('[data-ad-slot]').count()===0,'courtside no ads');
    await page.getByRole('button',{name:'Next →',exact:true}).click(); check((await page.locator('.courtside-header').textContent()).includes('Activity 2'),'next activity');
    await screenshot('courtside-desktop');
    await page.getByRole('button',{name:'Back to plan'}).click();
    // Native print preparation expands actual instructions and hides every ad/control.
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    await page.emulateMedia({media:'print'});
    check(await page.locator('.session-block details').evaluateAll(nodes=>nodes.every(n=>n.open)),'all print instructions expanded');
    check(await page.locator('.planner-form').isHidden(),'print hides planner editing controls');
    await page.pdf({path:path.join(output,'practice-plan.pdf'),format:'A4',printBackground:true});
    await screenshot('plan-print');
    await page.emulateMedia({media:'screen'}); await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    // Capture core local review pages at both sizes, plus sample ad placements in each allowed context.
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:1000}); const suffix=width===390?'mobile':'desktop';
      for(const [route,name] of [['/','home'],['/tennis-drills/','library'],['/tennis-drills/two-against-one/','activity'],['/practice-planner/','plan']]) {await open(route);await screenshot(`${name}-${suffix}`);}
      for(const [route,name] of [['/tennis-drills/?ads=preview','ads-library'],['/tennis-drills/two-against-one/?ads=preview','ads-activity'],['/tennis-drills/3-players/?ads=preview','ads-players']]) {
        await open(route); await page.waitForSelector('[data-ad-slot]'); check(await page.locator('[data-ad-slot]').count()===1,'one sample placement per page');
        const rect=await page.locator('[data-ad-slot]').boundingBox(); assert.equal(rect.height,width===390?250:120); assert.equal(rect.width,width===390?300:728);
        await screenshot(`${name}-${suffix}`);
        await page.locator('[data-ad-slot]').screenshot({path:path.join(screenshots,`${name}-slot-${suffix}.png`)});
        await page.emulateMedia({media:'print'}); check(await page.locator('[data-ad-slot]').isHidden(),'ads hidden from print'); await page.emulateMedia({media:'screen'});
      }
    }
    await open('/tennis-drills/?ads=live'); check(await page.locator('[data-ad-slot]').count()===0,'live query remains off');
    const offPositions=await page.locator('.activity-card').evaluateAll(nodes=>nodes.slice(0,8).map(n=>n.offsetTop));
    await open('/tennis-drills/'); assert.deepEqual(await page.locator('.activity-card').evaluateAll(nodes=>nodes.slice(0,8).map(n=>n.offsetTop)),offPositions,'off/live-inert layouts have identical card positions: no reserved gaps');
    await open('/practice-planner/?ads=preview'); check(await page.locator('[data-ad-slot]').count()===0,'no placements in planner');
    await page.getByRole('button',{name:'Start session',exact:true}).click(); check(await page.locator('[data-ad-slot]').count()===0,'no preview ads in active courtside');
    await page.getByRole('button',{name:'Back to plan'}).click();
    await page.getByRole('button',{name:'Clear saved session'}).click(); check(await page.evaluate(key=>localStorage.getItem(key),KEY)===null,'clear persisted plan');
    await page.evaluate(key=>localStorage.setItem(key,'{bad'),KEY); await page.reload(); await page.waitForFunction(()=>document.body.dataset.practiceReady==='true'); check((await page.locator('#planner-notice').textContent()).includes('invalid'),'invalid saved data handled');
    await page.getByRole('button',{name:'Generate my plan'}).click(); check(await page.locator('.session-block').count()===3,'usable after invalid storage');
    // Ready video controls and error fallback, using only an in-memory local fixture.
    await page.route('**/assets/videos/test.mp4',route=>route.fulfill({status:200,contentType:'video/mp4',body:Buffer.from('invalid local test media')}));
    await page.evaluate(async()=>{
      const {video}=await import('/practice/render.mjs'); const {hydrateVideos}=await import('/practice/video.mjs');
      const area=document.createElement('div');area.id='video-test';area.innerHTML=video({video:{status:'ready',source:'/assets/videos/test.mp4',title:'Reviewed test video',language:'en',duration:'00:10',transcript:'Local test transcript'}});document.querySelector('main').prepend(area);hydrateVideos(area);
    });
    check(await page.locator('#video-test video').getAttribute('controls')!==null,'ready video native controls');
    check(await page.locator('#video-test video').getAttribute('autoplay')===null,'no autoplay');
    await page.locator('#video-test video').evaluate(v=>{v.dispatchEvent(new Event('error'));});
    check(await page.locator('#video-test video').isHidden(),'failed video player hidden');
    check((await page.locator('#video-test [data-video-status]').textContent()).includes('illustrated instructions'),'video error retains instructions');
    await page.locator('#video-test').evaluate(n=>n.remove());
    const blocked=await browser.newContext();
    await blocked.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}}));
    const blockedPage=await blocked.newPage();await blockedPage.goto(origin+'/practice-planner/');await blockedPage.waitForFunction(()=>document.body.dataset.practiceReady==='true');
    check((await blockedPage.locator('#planner-notice').textContent()).includes('storage is unavailable'),'unavailable storage message');
    await blockedPage.getByRole('button',{name:'Generate my plan'}).click();check(await blockedPage.locator('.session-block').count()===3,'planner runs with unavailable storage');
    check((await blockedPage.locator('#planner-notice').textContent()).includes('Copy or print'),'storage failure reminder survives generation');await blocked.close();
    // An explicit analytics opt-in on localhost still cannot emit production tracking.
    const accept=page.getByRole('button',{name:'Accept analytics',exact:true}); if(await accept.isVisible()) await accept.click();
    check(external.length===0,'off + preview never request any third-party resources'); check(errors.length===0,'no console page errors'); check(failed.length===0,'no broken assets');
    const report={checks,routes:routes.length,widths:[360,390,768,1440],externalRequests:external,pageErrors:errors,failedResources:failed,screenshots:fs.readdirSync(screenshots).length};
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
