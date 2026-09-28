const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');const {chromium}=require('playwright');
(async()=>{
 const out=path.resolve('test-results/lighting');fs.mkdirSync(out,{recursive:true});let server,browser,page,log='';const errors=[];
 try{
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4183','--strictPort'],{stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
  const url='http://127.0.0.1:4183/?kitchenView=top';let ready=false;for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,log);
  browser=await chromium.launch();page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await page.getByRole('button',{name:'Open Main entry',exact:true}).first().click({noWaitAfter:true});
  await page.evaluate(async()=>{window.__rig=await import('/src/render/interiorScene.js');window.__lights=await import('/src/home/lightingStore.mjs');const s=window.__lights.lightingStore;s.set({...s.getSnapshot(),mode:'day'});});await page.waitForFunction(()=>window.__rig.getInteriorScene('entry')?.ready);
  const geometry=()=>page.evaluate(()=>{const r=window.__rig.getInteriorScene('entry'),out=[];r.scene.updateMatrixWorld(true);r.scene.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(p.userData.interiorFixture)return;out.push({p:Array.from(o.geometry.getAttribute('position').array),matrix:o.matrixWorld.toArray(),visible:o.visible});});return out;});
  const original=await geometry();const day=await page.evaluate(()=>window.__rig.getInteriorScene('entry').lighting);assert.equal(day.roomModes.entry,'day');assert.ok(day.fixtures.some(f=>f.layer==='cabinet'&&f.level>0));
  const dayImage=await page.locator('canvas').first().screenshot();fs.writeFileSync(path.join(out,'entry-day.png'),dayImage);
  await page.getByRole('button',{name:'Interior studio',exact:true}).click();const d=page.getByRole('dialog');await d.getByRole('button',{name:'Lighting',exact:true}).click();await d.getByLabel('Lighting mode',{exact:true}).selectOption('night');
  await page.waitForFunction(()=>window.__rig.getInteriorScene('entry').lighting.roomModes.entry==='night');
  const night=await page.evaluate(()=>window.__rig.getInteriorScene('entry').lighting);assert.ok(night.fixtures.every(f=>f.kelvin===2700));assert.deepEqual(await geometry(),original);
  await d.getByRole('button',{name:'Close interior studio',exact:true}).click();const nightImage=await page.locator('canvas').first().screenshot();fs.writeFileSync(path.join(out,'entry-night.png'),nightImage);assert.notDeepEqual(nightImage,dayImage);
  await page.getByRole('button',{name:'Interior studio',exact:true}).click();await d.getByRole('button',{name:'Lighting',exact:true}).click();await d.getByLabel('cabinet',{exact:true}).uncheck();
  const off=await page.evaluate(()=>window.__rig.getInteriorScene('entry').lighting.fixtures.filter(f=>f.layer==='cabinet'));assert.ok(off.every(f=>f.level===0));
  await d.getByLabel('Lighting scope',{exact:true}).selectOption('entry');await d.getByLabel('Lighting mode',{exact:true}).selectOption('day');assert.equal(await page.evaluate(()=>window.__rig.getInteriorScene('entry').lighting.roomModes.entry),'day');
  await page.screenshot({path:path.join(out,'lighting-panel.png')});await d.getByRole('button',{name:'Close interior studio',exact:true}).click();
  await page.getByRole('button',{name:'Return to whole home plan',exact:true}).click({noWaitAfter:true});await page.waitForFunction(()=>window.__rig.getInteriorScenes().length===0);await page.getByRole('button',{name:'Open Main entry',exact:true}).first().click({noWaitAfter:true});await page.waitForFunction(()=>window.__rig.getInteriorScene('entry')?.ready);assert.equal(await page.evaluate(()=>window.__rig.getInteriorScene('entry').lighting.roomModes.entry),'day');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:['actual day/night pixel change','4500K day and 2700K night fixtures','cabinet switch','room override','geometry invariance','cleanup/remount'],day,night,errors},null,2));
 }catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e)+'\n'+errors.join('\n'));if(page)await page.screenshot({path:path.join(out,'failure.png'),timeout:5000}).catch(()=>{});throw e;}finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
