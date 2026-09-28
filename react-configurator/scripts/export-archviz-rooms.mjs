// Fresh isolated browser: repository defaults, NOT the user's existing localStorage.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {prepareRoomExport} from './prepare-room-export.mjs';
const app=fileURLToPath(new URL('../',import.meta.url));
const root=path.dirname(app);
const routes={kitchen:'Kitchen',balcony:'Balcony office',study:'Study',bedroom1:'Bedroom 1',lobby:'Lobby / Dining',pooja:'Pooja Ghar',storage:'Storage',entry:'Main entry',drawing:'Drawing Room',bedroom3:'Bedroom 3'};
const args=process.argv.slice(2);
const option=(key,fallback)=>{const index=args.indexOf(key);if(index<0)return fallback;if(!args[index+1]||args[index+1].startsWith('--'))throw Error(`Missing value for ${key}`);return args[index+1];};
const rooms=option('--rooms','kitchen,balcony,bedroom3').split(',');
for(const room of rooms)if(!Object.hasOwn(routes,room))throw Error(`Automatic navigation is not defined for ${room}; export that active room through Interior studio.`);
const output=path.resolve(option('--output',path.join(root,'blender/archviz-input')));
const url=option('--url','http://127.0.0.1:4193');
let browser,server,serverLog='';
await fs.mkdir(output,{recursive:true});
try{
  if(!args.includes('--url')){
    server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4193','--strictPort'],{cwd:app,stdio:['ignore','pipe','pipe']});
    server.stdout.on('data',b=>serverLog=(serverLog+b).slice(-12000));server.stderr.on('data',b=>serverLog=(serverLog+b).slice(-12000));
    let ready=false;for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(serverLog);try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,serverLog);
  }
  const channel=option('--channel',process.env.ARCHVIZ_BROWSER_CHANNEL||null);
  browser=await chromium.launch({headless:true,...(channel?{channel}:{}),args:['--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/favicon.ico',route=>route.fulfill({status:204}));
  for(const room of rooms){
    console.log(`ARCHVIZ_EXPORT_START ${room}: repository defaults in an isolated browser`);
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:`Open ${routes[room]}`,exact:true}).first().click({noWaitAfter:true});
    await page.getByRole('button',{name:'Editable workspace',exact:true}).click({noWaitAfter:true});
    await page.evaluate(async()=>{window.__archvizScenes=await import('/src/render/interiorScene.js');});
    await page.waitForFunction(room=>window.__archvizScenes.getInteriorScenes().some(r=>r.id===room&&(r.ready||r.errors.length)),room);
    const sceneState=await page.evaluate(room=>{const r=window.__archvizScenes.getInteriorScene(room);return {ready:r?.ready,errors:r?.errors};},room);
    if(!sceneState.ready)throw Error(`${room} editable scene failed: ${sceneState.errors?.join('; ')||'scene did not mount'}`);
    await prepareRoomExport(page,room);
    // Keep a source screenshot, and export through the SAME UI path a user will use.
    await page.screenshot({path:path.join(output,`${room}-workspace.png`)});
    await page.getByRole('button',{name:'Interior studio',exact:true}).click();
    const dialog=page.getByRole('dialog');
    await dialog.getByRole('button',{name:'Blender export',exact:true}).click();
    await dialog.getByLabel('Room render profile',{exact:true}).selectOption(room);
    await dialog.getByLabel('Source 3D scene',{exact:true}).selectOption(room);
    const downloadPromise=page.waitForEvent('download',{timeout:180000});
    await dialog.getByRole('button',{name:'Export current design for Blender',exact:true}).click();
    const download=await downloadPromise;
    await download.saveAs(path.join(output,`A501-${room}-archviz.zip`));
    await page.screenshot({path:path.join(output,`${room}-export-panel.png`)});
    await dialog.getByRole('button',{name:'Close interior studio',exact:true}).click();
    console.log(`ARCHVIZ_EXPORT_COMPLETE ${room}`);
  }
  assert.deepEqual(errors,[],'Browser errors during real-room exports');
  await fs.writeFile(path.join(output,'export-session.json'),JSON.stringify({input:'repository defaults; isolated browser; not user browser saves',rooms,pageErrors:errors},null,2));
  await context.close();
}catch(error){
  const page=browser?.contexts()[0]?.pages()[0];
  if(page){
    const state=await page.evaluate(()=>({url:location.href,scenes:window.__archvizScenes?.getInteriorScenes().map(r=>({id:r.id,ready:r.ready,errors:r.errors}))})).catch(()=>null);
    console.error('ARCHVIZ_BROWSER_STATE',state);
    await page.screenshot({path:path.join(output,'export-failure.png'),timeout:5000}).catch(()=>{});
  }
  console.error(serverLog);throw error;
}
finally{await browser?.close();server?.kill('SIGTERM');}
