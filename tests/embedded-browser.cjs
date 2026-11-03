// Uses the existing read-only weekly:demo + weekly:preview server, never production.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin='http://127.0.0.1:4187',output='.local-review/embedded';
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],external=[]; let checks=0;
  const check=(value,message)=>{assert.ok(value,message);checks++};
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===origin)return route.continue();
    external.push(route.request().url());return route.abort();
  });
  try {
    for(const width of [360,390,768]) {
      await page.setViewportSize({width,height:844});
      for(const theme of ['light','dark']) {
        for(const route of ['/practice-planner/','/tennis-drills/','/play-score/umpire-challenge/','/clubs-coaches/','/demo/']) {
          await page.goto(origin+route+'?cu-app=1&cu-theme='+theme);
          await page.waitForFunction(()=>document.documentElement.dataset.cuApp==='1');
          check(!await page.locator('.site-header').isVisible(),'native chrome replaces site header');
          check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow '+width+' '+route+' '+theme);
          const palette=await page.evaluate(()=>({theme:document.documentElement.dataset.cuTheme,bg:getComputedStyle(document.body).backgroundColor}));
          check(palette.theme===theme,'explicit app appearance');
          check(palette.bg===(theme==='light'?'rgb(250, 251, 253)':'rgb(5, 17, 27)'),'resolved background palette');
          check(await page.locator('.site-footer').getByRole('link',{name:'Privacy Policy',exact:true}).isVisible(),'privacy access retained');
          if(route==='/demo/'&&width===390)await page.screenshot({path:output+'/article-'+theme+'.png'});
        }
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin+'/practice-planner/?players=3&cu-app=1&cu-theme=light');
    await page.getByRole('combobox',{name:'Duration',exact:true}).selectOption('30');
    await page.getByRole('button',{name:'Generate my plan',exact:true}).click();
    check(await page.locator('.session-block').count()===3,'planner creates a real structured session');
    await page.getByRole('link',{name:'Add activities',exact:true}).click();
    check(new URL(page.url()).searchParams.get('cu-theme')==='light','theme follows internal navigation');
    await page.goto(origin+'/practice-planner/?cu-app=1&cu-theme=dark');
    await page.locator('.session-block').first().waitFor();
    check(await page.locator('.session-block').count()===3,'saved planner survives return navigation');
    check(await page.getByRole('combobox',{name:'Players',exact:true}).inputValue()==='3','player choice restored by existing tool');
    // New presentation must never extend comment/consent/tool payload contracts.
    await page.evaluate(()=>{const form=document.createElement('form');form.id='payload-fixture';form.innerHTML='<input name="name" value="Fixture"><input name="body" value="Local test only">';document.body.append(form)});
    await page.waitForTimeout(100);
    check(await page.locator('#payload-fixture').evaluate(form=>[...new FormData(form).keys()].join(',')==='name,body'),'presentation does not add form fields');
    await page.getByRole('button',{name:'Print / Save PDF',exact:true}).click();
    await page.waitForURL(url=>url.searchParams.get('cu-action')==='print');
    check(new URL(page.url()).searchParams.get('cu-action')==='print','existing print control requests native print');
    await page.goto(origin+'/demo/?cu-app=1&cu-theme=light');
    const contents=page.locator('.weekly-app-contents');
    check(!await contents.evaluate(node=>node.open),'app article contents starts collapsed');
    await contents.locator('summary').click();
    await contents.getByRole('link',{name:'Selected results',exact:true}).click();
    check(new URL(page.url()).hash==='#results','article anchors still work');
    // Older published rows contain stored article HTML without the new disclosure.
    // Simulate that markup only in the local browser fixture, keeping its source nav.
    await page.evaluate(()=>document.querySelector('.weekly-app-contents').remove());
    check(await page.locator('.weekly-contents').isVisible(),'older stored article retains its contents navigation');
    await page.locator('.weekly-contents').getByRole('link',{name:'Selected results',exact:true}).click();
    check(new URL(page.url()).hash==='#results','older article source anchors remain usable');
    // Native redirect/POST recovery calls the same initializer without reloading the form.
    await page.goto(origin+'/practice-planner/');
    check(await page.locator('.site-header').isVisible(),'ordinary tool chrome remains visible');
    const ordinaryBackground=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
    await page.waitForFunction(()=>document.body.dataset.practiceReady==='true');
    await page.getByRole('combobox',{name:'Players',exact:true}).selectOption('4');
    await page.evaluate(async()=>{const module=await import('/weekly/embedded.mjs');module.startEmbeddedPresentation('light')});
    check(!await page.locator('.site-header').isVisible(),'explicit native initializer recovers app mode after lost query');
    check(await page.getByRole('combobox',{name:'Players',exact:true}).inputValue()==='4','initializer preserves existing tool form state');
    check(new URL(page.url()).searchParams.get('cu-app')==='1','recovered destination retains app mode');
    await page.evaluate(()=>window.courtUmpirePresentation.setTheme('dark'));
    check(await page.evaluate(()=>document.documentElement.dataset.cuTheme)==='dark','system/app theme can change without reloading');
    await page.evaluate(async()=>{const module=await import('/weekly/embedded.mjs');module.startEmbeddedPresentation('light')});
    check(await page.locator('link[data-cu-embedded-style]').count()===1,'initializer is idempotent');
    await page.goto(origin+'/tennis-drills/');
    check(await page.evaluate(()=>!document.documentElement.dataset.cuApp),'ordinary navigation remains opt-out');
    await page.getByRole('navigation',{name:'Main navigation'}).getByText('Play & Score',{exact:true}).click();
    check(await page.getByRole('link',{name:'You’re the Umpire',exact:true}).first().isVisible(),'ordinary Play & Score menu contains usable links');
    await page.goto(origin+'/play-score/?cu-app=1&cu-theme=light');
    for(const link of await page.locator('a[href*="/play-score/scoreboard/"]').all())check(!await link.isVisible(),'website live-score navigation is hidden in app presentation');
    await page.goto(origin+'/play-score/scoreboard/?cu-app=1&cu-theme=light');
    check(!await page.locator('#match-setup').isVisible(),'app presentation cannot expose web match setup');
    await page.goto(origin+'/play-score/scoreboard/');
    check(await page.locator('.site-header').isVisible(),'ordinary browser header unchanged');
    check(await page.locator('#match-setup').isVisible(),'ordinary browser scoring unchanged');
    check(errors.length===0,JSON.stringify(errors));
    check(external.length===0,'no third-party requests in local checks');
    fs.writeFileSync(output+'/results.json',JSON.stringify({checks,widths:[360,390,768],themes:['light','dark'],pageErrors:errors,externalRequests:external},null,2));
    console.log('Embedded browser checks passed: '+checks);
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
