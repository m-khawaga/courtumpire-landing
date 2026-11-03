
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(process.env.CU_WEBSITE || path.join(__dirname,'..'));
const {chromium} = require(path.join(repo,'node_modules/playwright'));
const output = process.env.CU_REVIEW_OUTPUT || __dirname;
const before = process.env.CU_BEFORE;
const origin = 'https://courtumpire.com';
const articlePath = '/weekly/2026-10-30-titles-turnarounds-and-a-farewell/';
const articleBaseline = path.join(output,'baseline/article.html');
const fixtures = new Map([
  [articlePath, articleBaseline],
  ['/weekly/', path.join(output,'baseline/archive.html')],
  ['/sitemap.xml',path.join(output,'baseline/index.xml')],
  ['/weekly/site-static.xml',path.join(output,'baseline/site-static.xml')],
  ['/weekly/sitemap-1.xml',path.join(output,'baseline/sitemap-1.xml')]
]);
const screens = new Map([
  ['quiz','/play-score/umpire-challenge/'],
  ['result','/play-score/result-card/'],
  ['planner','/practice-planner/'],
  ['article',articlePath],
  ['archive','/weekly/']
]);
const mime = {html:'text/html',css:'text/css',mjs:'text/javascript',js:'text/javascript',xml:'application/xml',png:'image/png',svg:'image/svg+xml',webp:'image/webp',json:'application/json'};
async function main(){
 const browser=await chromium.launch();
 try{
  let checks=0;
  for(const mode of ['light','dark','normal']){
   const context=await browser.newContext({acceptDownloads:true});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    const pathname = url.pathname.endsWith('/analytics.js') ? '/analytics.js' : url.pathname;
    const relative = pathname.endsWith('/')?pathname+'index.html':pathname;
    const previous = before && path.join(before,relative);
    const file=fixtures.get(pathname)||(previous&&fs.existsSync(previous)?previous:path.join(repo,relative));
    if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Fixture unavailable'});
    await route.fulfill({path:file,contentType:mime[path.extname(file).slice(1)]||'application/octet-stream'});
   });
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror', error=>errors.push(error.message));
   const params=mode==='normal'?'':'?cu-app=1&cu-theme='+mode;
   const visit=async route=>{
    await page.goto(origin+route+params);
    if(mode!=='normal') await page.waitForFunction(()=>document.documentElement.dataset.cuApp==='1');
    const reject=page.getByRole('button',{name:'Reject analytics',exact:true});
    if(await reject.isVisible())await reject.click();
   };
   for(const width of [320,360,390,412,1440]){
    await page.setViewportSize({width,height:850});
    for(const [name,route] of screens){
     await visit(route);
     if(before){
      if(width===390){
       if(name==='quiz')await page.locator('#quiz-question').waitFor();
       if(name==='result')await page.locator('canvas:not([hidden])').waitFor();
       await page.screenshot({path:path.join(output,'before-'+mode+'-'+name+'.png')});
      }
      continue;
     }
     assert.equal(await page.locator('.site-header').first().isVisible(),mode==='normal');
     assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+route);
     if(mode!=='normal'){
      const legal=page.locator('.cu-legal');
      await legal.locator('summary').click();
      assert.equal(await legal.getByRole('link',{name:'Privacy Policy'}).isVisible(),true);
      assert.equal(await legal.getByRole('link',{name:'Site map'}).count(),0);
      assert.equal(await legal.getByRole('button',{name:'Analytics settings'}).isVisible(),true);
      await legal.locator('summary').click();
     }
     if(name==='article'){
      const compact=page.locator('.weekly-compact-results');
      await compact.waitFor({state:width<=720?'visible':'hidden'});
      assert.equal(await compact.locator('[data-result-index]').count(),27);
      const block=page.locator('.weekly-schedule-block').first();
      const panel=block.locator('.weekly-filter-panel');
      await panel.locator('summary').click();
      await panel.getByRole('combobox',{name:'Tour',exact:true}).selectOption('ATP');
      assert.equal(await panel.locator('summary').textContent(),'Filters (1)');
      await panel.locator('summary').click();
      assert.equal(await block.getByRole('button',{name:'Remove Tour: ATP'}).isVisible(),true);
      await block.getByRole('button',{name:'Remove Tour: ATP'}).click();
      await block.locator('input[type=search]').fill('nonmatching-fixture-search');
      assert.match(await block.locator('[role=status]').textContent(),/Showing 0 of 9/);
      await block.getByRole('button',{name:'Clear filters'}).click();
      assert.match(await block.locator('[role=status]').textContent(),/Showing 9 of 9/);
      if(mode!=='normal'){
       const contents=page.locator('.weekly-app-contents');
       await contents.locator('summary').click();
       assert.ok(await contents.locator('a').count()>1);
       await contents.locator('a').first().click();
       assert.ok(new URL(page.url()).hash);
      }
     }
     if(name==='planner')assert.equal(await page.locator('.cu-planner-help').count(),mode==='normal'?0:1);
     if(name==='quiz'){
      await page.locator('#quiz-question').waitFor();
      const heights=await page.locator('.quiz-settings').evaluate(el=>['select','button'].map(tag=>el.querySelector(tag).getBoundingClientRect().height));
      assert.ok(Math.abs(heights[0]-heights[1]) <= 1, heights.join(' / '));
     }
     const overflow = await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1 ? [] :
       [...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && !el.closest('.weekly-table')).slice(0,12).map(el=>[el.tagName,el.className,el.getBoundingClientRect().right]));
     assert.deepEqual(overflow,[],name+' '+mode+' '+width);
     if(width===390) {
      if(name==='result'){
       await page.locator('canvas:not([hidden])').waitFor();
       await page.locator('#download-card').scrollIntoViewIfNeeded();
      }else await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:path.join(output,mode+'-'+name+'.png')});
     }
     checks++;
    }
   }
   if(before){await context.close();continue;}
   await page.setViewportSize({width:320,height:850});
   await visit(screens.get('quiz'));
   await page.addStyleTag({content:'html{font-size:125%}'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   const submit=page.getByRole('button',{name:'Submit answer'});
   assert.equal(await submit.isDisabled(),true);
   await page.getByRole('radio').first().check();
   await submit.click();
   assert.equal(await page.locator('.quiz-message a').isVisible(),true);
   await page.getByRole('button',{name:'Next',exact:true}).click();
   assert.match(await page.locator('.quiz-progress').textContent(),/Question 2 of 10/);
   await page.getByRole('button',{name:'New quiz',exact:true}).click();
   await page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();
   assert.match(await page.locator('.quiz-progress').textContent(),/Question 2 of 10/);
   if(mode==='normal'){
    await visit(screens.get('result'));
    const button=page.getByRole('button',{name:'Download PNG'});
    await page.waitForFunction(()=>document.querySelector('#download-card')?.disabled===false);
    await page.locator('[name=layout]').selectOption('portrait');
    assert.equal(await button.isDisabled(),true);
    await page.getByRole('button',{name:'Preview result card'}).click();
    const ready=page.waitForEvent('download');
    await button.click();
    const download=await ready;
    const buffer=fs.readFileSync(await download.path());
    assert.equal(buffer.subarray(1,4).toString(),'PNG');
    assert.equal(buffer.readUInt32BE(16),1080);
    assert.equal(buffer.readUInt32BE(20),1350);
    const preview=await page.locator('canvas#result-canvas').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
    assert.deepEqual(buffer,Buffer.from(preview,'base64'));
   }else{
    await visit(screens.get('planner'));
    const legal=page.locator('.cu-legal');
    await legal.locator('summary').click();
    await legal.getByRole('button',{name:'Analytics settings'}).click();
    await page.getByRole('button',{name:'Close settings'}).click();
    await page.goto(origin+screens.get('quiz'));
    assert.equal(await page.locator('.site-header').first().isVisible(),true);
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }
  console.log('Passed '+checks+' layout checks and quiz, article, legal, browser PNG and opt-in checks.');
 } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
