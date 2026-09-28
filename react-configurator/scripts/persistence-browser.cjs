const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const {openKitchen} = require('./browser-helpers.cjs');
const legacyKey = 'kitchen-autosave-v4-west-wet-east-open-garage';
const key = `${legacyKey}:schema-1`;
const fields = ['schemaVersion','format','unit','kitchen','east','west','grid','materials','modules','eastTopUpperDepth','westTopUpperDepth','viewOptions'];
const core = document => Object.fromEntries(fields.map(field => [field, document[field]]));

(async () => {
  const url = new URL(process.env.KITCHEN_APP_URL || 'http://127.0.0.1:4176');
  url.searchParams.set('kitchenView','top');
  const out = path.resolve('test-results/persistence');fs.mkdirSync(out,{recursive:true});
  let server, browser, page, output='';
  const steps=[],errors=[];
  const step=message=>{steps.push(message);console.log(`[persistence] ${message}`);};
  const read = page => page.evaluate(() => window.kitchenAPI.getProjectData());
  const saved = page => page.getByRole('status',{name:'Project save status'}).filter({hasText:/^Saved/}).waitFor();
  const upload = (page, document, name='project.json') => page.getByLabel('Project JSON file').setInputFiles({
    name,mimeType:'application/json',buffer:Buffer.from(typeof document==='string'?document:JSON.stringify(document)),
  });
  const ready = async page => {page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await openKitchen(page,url.href);};
  try {
    if(!process.env.KITCHEN_APP_URL){
      server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4176','--strictPort'],{stdio:['ignore','pipe','pipe']});
      const collect=data=>{output=(output+data).slice(-8000);};server.stdout.on('data',collect);server.stderr.on('data',collect);
      server.on('error',error=>{output+=String(error);});
      const deadline=Date.now()+30000;let ok=false;
      while(Date.now()<deadline){
        if(server.exitCode!==null)throw new Error(`Vite exited: ${output}`);
        try{if((await fetch(url)).ok){ok=true;break;}}catch{}
        await new Promise(resolve=>setTimeout(resolve,200));
      }
      assert.ok(ok,`Server did not start: ${output}`);
    }
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    page=await context.newPage();await ready(page);await saved(page);
    const baseline=core(await read(page));assert.equal(baseline.schemaVersion,1);
    const custom=structuredClone(baseline);
    custom.east.find(item=>item.id==='gas').y=2255;
    custom.west.find(item=>item.id==='sinkUpperDishRack').z=1401;
    custom.eastTopUpperDepth=425;custom.viewOptions.hide3DObstructions=false;
    step('Importing custom positions, elevation and options through file control');
    await upload(page,custom);
    await page.waitForFunction(()=>window.kitchenAPI?.getLayout().east.find(item=>item.id==='gas').y===2255);
    await saved(page);assert.deepEqual(core(await read(page)),custom);
    await page.reload();await ready(page);await saved(page);
    assert.deepEqual(core(await read(page)),custom,'Reload must not reset custom hob/upper depth');

    step('Download/upload round trip and named versions');
    const downloadEvent=page.waitForEvent('download');
    await page.getByRole('button',{name:'Save Project JSON',exact:true}).click();
    const download=await downloadEvent;const downloaded=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.deepEqual(core(downloaded),custom);
    await page.getByRole('button',{name:'Save A project',exact:true}).click();
    await page.evaluate(()=>window.kitchenAPI.reset());await saved(page);
    await page.getByRole('button',{name:'Load A project',exact:true}).click();
    await page.waitForFunction(()=>window.kitchenAPI?.getLayout().east.find(item=>item.id==='gas').y===2255);
    assert.deepEqual(core(await read(page)),custom);
    await upload(page,downloaded);await saved(page);assert.deepEqual(core(await read(page)),custom);

    step('Malformed imports leave both workspace and saved bytes unchanged');
    const before=core(await read(page));const stored=await page.evaluate(key=>localStorage.getItem(key),key);
    for(const [invalid,message] of [['{','Invalid project JSON'], [{...custom,schemaVersion:999},'Unsupported project schema'], [{...custom,modules:{east:custom.modules.east,west:[{id:'broken',width:-1}]}},'Invalid west module width']]){
      await upload(page,invalid);
      await page.getByRole('alert').filter({hasText:message}).waitFor();
      assert.deepEqual(core(await read(page)),before);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),stored);
    }

    step('A delayed file read cannot overwrite a newer edit');
    await page.evaluate(()=>{
      const original=File.prototype.text;window.__originalFileText=original;
      File.prototype.text=function(){if(this.name==='slow.json')return new Promise(resolve=>{window.__releaseFile=()=>original.call(this).then(resolve);});return original.call(this);};
    });
    await upload(page,baseline,'slow.json');await page.waitForFunction(()=>typeof window.__releaseFile==='function');
    await page.evaluate(()=>window.kitchenAPI.moveItemMM('east','gas',2266));
    await page.waitForFunction(()=>window.kitchenAPI.getLayout().east.find(item=>item.id==='gas').y===2266);
    await page.evaluate(()=>window.__releaseFile());
    await page.getByRole('alert').filter({hasText:'project changed while'}).waitFor();
    assert.equal((await read(page)).east.find(item=>item.id==='gas').y,2266);
    await page.evaluate(()=>{File.prototype.text=window.__originalFileText;});

    step('Cross-tab changes block stale autosave and remain recoverable');
    await saved(page);
    const other=await context.newPage();await other.goto(url.href);
    const external=JSON.stringify(baseline);await other.evaluate(({key,external})=>localStorage.setItem(key,external),{key,external});
    await page.evaluate(()=>window.kitchenAPI.moveItemMM('east','gas',2277));
    await page.getByRole('status',{name:'Project save status'}).filter({hasText:'another tab'}).waitFor();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),external);
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Resume autosave',exact:true}).click();await saved(page);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key+':recovery'),key),external);
    await other.close();
    await page.getByRole('button',{name:'Restore previous autosave',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'project-desktop.png')});
    await page.setViewportSize({width:390,height:900});
    await page.getByRole('button',{name:'Restore previous autosave',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'project-mobile.png')});
    await context.close();

    step('Legacy autosave migrates without altering its original key');
    const legacy=structuredClone(custom);delete legacy.schemaVersion;delete legacy.format;
    const legacyText=JSON.stringify(legacy);
    const legacyContext=await browser.newContext();await legacyContext.addInitScript(({legacyKey,legacyText})=>localStorage.setItem(legacyKey,legacyText),{legacyKey,legacyText});
    page=await legacyContext.newPage();await ready(page);await saved(page);
    assert.deepEqual(core(await read(page)),custom);
    assert.equal(await page.evaluate(legacyKey=>localStorage.getItem(legacyKey),legacyKey),legacyText);await legacyContext.close();

    step('Corrupt autosave is visible, never silently overwritten');
    const corruptContext=await browser.newContext();await corruptContext.addInitScript(key=>localStorage.setItem(key,'broken-json'),key);
    page=await corruptContext.newPage();await ready(page);
    await page.getByRole('status',{name:'Project save status'}).filter({hasText:'Not saved:'}).waitFor();
    await page.evaluate(()=>window.kitchenAPI.moveItemMM('east','gas',2288));
    await page.waitForFunction(()=>window.kitchenAPI.getLayout().east.find(item=>item.id==='gas').y===2288);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'broken-json');
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Resume autosave',exact:true}).click();await saved(page);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key+':recovery'),key),'broken-json');await corruptContext.close();

    step('Storage quota errors are visible while the editable project remains available');
    const quotaContext=await browser.newContext();await quotaContext.addInitScript(key=>{
      const original=Storage.prototype.setItem;window.__originalSetItem=original;
      Storage.prototype.setItem=function(name,value){if(name.startsWith(key))throw new DOMException('Storage full','QuotaExceededError');return original.call(this,name,value);};
    },key);
    page=await quotaContext.newPage();await ready(page);
    await page.getByRole('status',{name:'Project save status'}).filter({hasText:'Not saved:'}).waitFor();
    await page.evaluate(()=>window.kitchenAPI.moveItemMM('east','gas',2299));
    await page.waitForFunction(()=>window.kitchenAPI.getLayout().east.find(item=>item.id==='gas').y===2299);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
    assert.equal((await read(page)).east.find(item=>item.id==='gas').y,2299);
    await quotaContext.close();page=null;
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:steps,pageErrors:errors},null,2));
  }catch(error){
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(error),steps,errors,serverOutput:output},null,2));
    if(page)await page.screenshot({path:path.join(out,'failure.png'),timeout:5000}).catch(()=>{});
    throw error;
  }finally{
    if(browser)await browser.close();
    if(server){server.kill('SIGTERM');await new Promise(resolve=>{
      if(server.exitCode!==null)return resolve();server.once('exit',resolve);
      setTimeout(()=>{server.kill('SIGKILL');resolve();},3000).unref();
    });}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
