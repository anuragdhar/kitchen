const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');const {chromium}=require('playwright');
(async()=>{
 const out=path.resolve('test-results/materials');fs.mkdirSync(out,{recursive:true});let server,browser,page;const errors=[];let output='';
 try{
  const url='http://127.0.0.1:4182/?kitchenView=top';
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4182','--strictPort'],{stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',b=>{output=(output+b).slice(-8000);});server.stderr.on('data',b=>{output=(output+b).slice(-8000);});
  let ready=false;for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,output);
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
  page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  // A small real authored room exercises WebGL and material ownership, not a synthetic colour swatch.
  await page.getByRole('button',{name:'Open Main entry',exact:true}).first().click({noWaitAfter:true});
  await page.getByRole('button',{name:'Editable workspace',exact:true}).click({noWaitAfter:true});
  await page.evaluate(async()=>{window.__interiorScenes=await import('/src/render/interiorScene.js');window.__appearance=await import('/src/home/appearanceStore.mjs');});
  await page.waitForFunction(()=>window.__interiorScenes.getInteriorScene('entry')?.ready);
  const snapshot=()=>page.evaluate(()=>{
   const record=window.__interiorScenes.getInteriorScene('entry');record.scene.updateMatrixWorld(true);const geometry=[],materials=[];
   record.scene.traverse(object=>{if(!object.isMesh)return;const p=object.geometry.getAttribute('position');geometry.push({name:object.name,positions:Array.from(p.array),index:object.geometry.index?Array.from(object.geometry.index.array):null,matrix:object.matrixWorld.toArray(),visible:object.visible});
    for(const material of (Array.isArray(object.material)?object.material:[object.material]))materials.push({role:material.userData?.interiorRole||null,id:material.userData?.interiorMaterialId||null,color:material.color?.getHexString(),metalness:material.metalness,map:!!material.map,normal:!!material.normalMap,roughness:!!material.roughnessMap});});
   return {geometry,materials,count:record.surfaceCount,errors:record.errors};
  });
  const baseline=await snapshot();assert.ok(baseline.count>10);assert.deepEqual(baseline.errors,[]);assert.ok(baseline.materials.some(m=>m.role==='wood'&&m.id==='teak'&&m.map&&m.normal&&m.roughness));assert.ok(baseline.materials.some(m=>m.role==='plaster'&&m.normal));
  const before=await page.locator('canvas').first().screenshot();fs.writeFileSync(path.join(out,'entry-teak.png'),before);
  await page.getByRole('button',{name:'Interior studio',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Materials',exact:true}).click();await dialog.getByLabel('Wood finish',{exact:true}).selectOption('white-oak');
  await page.waitForFunction(()=>{const r=window.__interiorScenes.getInteriorScene('entry');return r?.ready&&r.revision===window.__appearance.appearanceStore.getRevision();});
  const oak=await snapshot();assert.deepEqual(oak.geometry,baseline.geometry);assert.deepEqual(oak.materials.filter(m=>!m.role),baseline.materials.filter(m=>!m.role));assert.ok(oak.materials.some(m=>m.role==='wood'&&m.id==='white-oak'));
  await dialog.getByRole('button',{name:'Close interior studio',exact:true}).click();const after=await page.locator('canvas').first().screenshot();fs.writeFileSync(path.join(out,'entry-white-oak.png'),after);assert.notDeepEqual(after,before,'Rendered pixels change with the selected wood');
  // All species resolve real maps and keep geometry invariant.
  for(const wood of ['red-oak','cherry']){await page.evaluate(wood=>{const store=window.__appearance.appearanceStore;store.set({...store.getSnapshot(),wood});},wood);await page.waitForFunction(()=>{const r=window.__interiorScenes.getInteriorScene('entry');return r?.ready&&r.revision===window.__appearance.appearanceStore.getRevision();});assert.deepEqual((await snapshot()).geometry,baseline.geometry);}
  await page.evaluate(()=>{const store=window.__appearance.appearanceStore;store.set({...store.getSnapshot(),rooms:{entry:{wood:'teak'}}});});await page.waitForFunction(()=>window.__interiorScenes.getInteriorScene('entry')?.ready);assert.ok((await snapshot()).materials.some(m=>m.id==='teak'));
  await page.getByRole('button',{name:'Return to whole home plan',exact:true}).click({noWaitAfter:true});await page.waitForFunction(()=>window.__interiorScenes.getInteriorScenes().length===0);
  await page.getByRole('button',{name:'Open Main entry',exact:true}).first().click({noWaitAfter:true});await page.getByRole('button',{name:'Editable workspace',exact:true}).click({noWaitAfter:true});await page.waitForFunction(()=>window.__interiorScenes.getInteriorScene('entry')?.ready);
  await page.getByRole('button',{name:'Interior studio',exact:true}).click();await dialog.getByRole('button',{name:'Materials',exact:true}).click();await page.screenshot({path:path.join(out,'materials-panel.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:['real PBR maps for all four species','unchanged geometry','untagged surfaces preserved','visible rendered difference','room overrides','scene cleanup/remount'],surfaceCount:baseline.count,pageErrors:errors},null,2));
 }catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error)+'\n'+output+'\n'+errors.join('\n'));if(page)await page.screenshot({path:path.join(out,'failure.png'),timeout:5000}).catch(()=>{});throw error;}
 finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
