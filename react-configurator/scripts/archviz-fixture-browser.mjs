import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import JSZip from 'jszip';
const out=path.resolve('test-results/archviz');await fs.mkdir(out,{recursive:true});
let server,browser,log='';
try{
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4194','--strictPort'],{stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',b=>log=(log+b).slice(-8000));server.stderr.on('data',b=>log=(log+b).slice(-8000));
  const url='http://127.0.0.1:4194';let ready=false;
  for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,log);
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({acceptDownloads:true,viewport:{width:1200,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const download=page.waitForEvent('download');
  const result=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {registerInteriorScene}=await import('/src/render/interiorScene.js');
    const {captureInteriorScene,exportArchvizBundle,downloadArchvizBundle}=await import('/src/render/archvizExport.js');
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1.5,.01,10000);
    camera.position.set(2200,1600,2600);camera.lookAt(0,400,0);
    const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(600,400);
    const furniture=new THREE.Group();furniture.rotation.y=.37;furniture.position.set(150,0,-200);scene.add(furniture);
    const texture=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=4;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,4,4);return new THREE.CanvasTexture(canvas);};
    const material=new THREE.MeshStandardMaterial({map:texture('#b7a282'),normalMap:texture('#8080ff'),roughnessMap:texture('#888888'),roughness:.45});
    const cabinet=new THREE.Mesh(new THREE.BoxGeometry(600,800,300),material);cabinet.position.y=400;cabinet.name='Known 600 mm cabinet';furniture.add(cabinet);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(5000,80,5000),material.clone());floor.position.y=-40;scene.add(floor);
    const hidden=new THREE.Group();hidden.visible=false;hidden.add(new THREE.Mesh(new THREE.BoxGeometry(99999,99999,99999),new THREE.MeshBasicMaterial()));scene.add(hidden);
    const fixture=new THREE.Group();fixture.userData.interiorFixture=true;fixture.add(new THREE.Mesh(new THREE.BoxGeometry(20000,20000,20000),new THREE.MeshBasicMaterial()));scene.add(fixture);
    // This isolated fixture stands in for the kitchen; identity must match the
    // selected room just as it does for a real editable-scene export.
    const record=registerInteriorScene({id:'kitchen',scene,camera,renderer,metresPerUnit:.001});await record.whenReady;
    const before=JSON.stringify(scene.toJSON());const capture=captureInteriorScene(record,'kitchen');const count=capture.meshes.length;capture.dispose();
    const {blob,manifest}=await exportArchvizBundle(record.id,'kitchen');
    const unchanged=before===JSON.stringify(scene.toJSON());downloadArchvizBundle(blob,'fixture');record.dispose();renderer.dispose();
    return {count,unchanged,manifest};
  });
  await (await download).saveAs(path.join(out,'fixture.zip'));
  const zip=await JSZip.loadAsync(await fs.readFile(path.join(out,'fixture.zip')));
  const glb=await zip.file('scene.glb').async('nodebuffer');
  const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
  assert.equal(gltf.images.length,3,'equivalent materials reuse their color, normal and roughness images');
  assert.equal(result.count,2);assert.equal(result.unchanged,true);assert.equal(result.manifest.metresPerSourceUnit,.001);assert.deepEqual(errors,[]);
  assert.equal(result.manifest.sceneId,'kitchen');
  assert.equal(result.manifest.room,'kitchen');
  await fs.writeFile(path.join(out,'fixture-result.json'),JSON.stringify(result,null,2));
  console.log('ARCHVIZ_FIXTURE_OK: millimetres, rotated hierarchy, hidden ancestor, overlay exclusion, matching room identity and non-mutation');
}finally{await browser?.close();server?.kill('SIGTERM');}
