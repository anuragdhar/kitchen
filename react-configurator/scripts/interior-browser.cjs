const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');const {chromium}=require('playwright');
(async()=>{
 const out=path.resolve('test-results/interior');fs.mkdirSync(out,{recursive:true});let server,browser,page;const errors=[];let logs='';
 try{
  const url='http://127.0.0.1:4181/?kitchenView=top';
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4181','--strictPort'],{stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
  let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(logs);try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,logs);
  browser=await chromium.launch();page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);assert.equal(await page.title(),'Home Interior');await page.getByRole('button',{name:'Interior studio',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Title',{exact:true}).fill('Entry teak slats');await dialog.getByLabel('Reference URL',{exact:true}).fill('https://www.pinterest.com/pin/123456/');await dialog.getByLabel('Tags, comma separated').fill('teak, cabinet lights');await dialog.getByLabel('What should we borrow from this idea?').fill('Vertical grain and a warm shelf light.');await dialog.getByRole('button',{name:'Save inspiration',exact:true}).click();
  await dialog.getByRole('link',{name:'Entry teak slats'}).waitFor();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('home-interior.inspiration.v1')));assert.equal(stored.items.length,1);assert.equal(stored.items[0].room,'entry');
  await page.reload();await page.getByRole('button',{name:'Interior studio',exact:true}).click();await dialog.getByRole('link',{name:'Entry teak slats'}).waitFor();
  await page.screenshot({path:path.join(out,'studio-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'studio-mobile.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:['branding','reference creation','reference persistence','responsive dialog'],pageErrors:errors},null,2));
 }catch(e){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
